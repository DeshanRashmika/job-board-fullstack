"""
Management command: fetch_itpro_jobs
-------------------------------------
Fetches the latest IT jobs from itpro.lk via their public RSS feed and
saves them to the local database as external jobs (is_external=True).

Usage:
    python manage.py fetch_itpro_jobs            # fetch default 50 items
    python manage.py fetch_itpro_jobs --max 100  # fetch up to 100 items

How it works:
  1. Creates (or re-uses) a system user 'itpro_bot' as the job owner.
  2. Fetches https://itpro.lk/rss/all/ and parses each <item>.
  3. For each item, uses external_url as a unique key — skips if already in DB.
  4. Parses Company, Location, Job Type, and Description from <content:encoded>.
  5. Maps ITPro job types to our internal choices (FULL_TIME / PART_TIME / CONTRACT / REMOTE).
  6. Saves new jobs; updates description on existing ones.
"""

import re
import urllib.request
import xml.etree.ElementTree as ET
from html import unescape

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from jobs_api.models import Job, JobCategory

User = get_user_model()

RSS_URL   = 'https://itpro.lk/rss/all/'
NS        = {'content': 'http://purl.org/rss/1.0/modules/content/'}
BOT_USER  = 'itpro_bot'

# Map ITPro job type strings → our Job.JOB_TYPES choices
JOB_TYPE_MAP = {
    'full-time':  'FULL_TIME',
    'full time':  'FULL_TIME',
    'part-time':  'PART_TIME',
    'part time':  'PART_TIME',
    'freelance':  'CONTRACT',
    'contract':   'CONTRACT',
    'internship': 'FULL_TIME',   # closest match; no INTERNSHIP choice in model
    'remote':     'REMOTE',
}

# Map ITPro category slugs → our JobCategory names
CATEGORY_MAP = {
    'software-engineering':  'Engineering',
    'quality-assurance':     'Engineering',
    'web-development':       'Engineering',
    'mobile-development':    'Engineering',
    'information-technology':'Engineering',
    'devops-cloud':          'Engineering',
    'ai-and-data':           'Data',
    'management-business':   'Product',
    'design-creative':       'Design',
    'digital-marketing':     'Marketing',
    'hardware-networking':   'Engineering',
    'academic':              'Product',
}


def _strip_html(html: str) -> str:
    """Remove HTML tags and decode entities into plain text."""
    text = re.sub(r'<[^>]+>', ' ', html)
    text = unescape(text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def _parse_encoded(raw: str) -> dict:
    """
    Extract Company, Location, Job Type, Description from the
    <content:encoded> CDATA block.

    ITPro RSS format:
        <strong>Company:</strong> ACME Ltd<br>
        <strong>Location:</strong> Colombo<br>
        <strong>Job Type:</strong> Full-time<br><br>
        <strong>Description:</strong><br>...
    """
    result = {
        'company':  '',
        'location': 'Sri Lanka',
        'job_type': 'FULL_TIME',
        'description': '',
    }

    # Company
    m = re.search(r'<strong>Company:</strong>\s*(.*?)<br', raw, re.IGNORECASE | re.DOTALL)
    if m:
        result['company'] = _strip_html(m.group(1)).strip()

    # Location
    m = re.search(r'<strong>Location:</strong>\s*(.*?)<br', raw, re.IGNORECASE | re.DOTALL)
    if m:
        result['location'] = _strip_html(m.group(1)).strip() or 'Sri Lanka'

    # Job Type
    m = re.search(r'<strong>Job Type:</strong>\s*(.*?)<br', raw, re.IGNORECASE | re.DOTALL)
    if m:
        raw_type = _strip_html(m.group(1)).strip().lower()
        result['job_type'] = JOB_TYPE_MAP.get(raw_type, 'FULL_TIME')

    # Description — everything after <strong>Description:</strong>
    m = re.search(r'<strong>Description:</strong>(.*)', raw, re.IGNORECASE | re.DOTALL)
    if m:
        result['description'] = _strip_html(m.group(1)).strip()

    return result


def _guess_category(url: str) -> str | None:
    """
    Try to infer a category name from the job URL path.
    ITPro category pages look like /jobs/software-engineering/
    """
    for slug, cat_name in CATEGORY_MAP.items():
        if slug in url:
            return cat_name
    return None


class Command(BaseCommand):
    help = 'Fetch latest jobs from itpro.lk RSS feed and save to DB'

    def add_arguments(self, parser):
        parser.add_argument(
            '--max',
            type=int,
            default=50,
            help='Maximum number of jobs to import (default: 50)',
        )

    def handle(self, *args, **options):
        max_items = options['max']

        # ── 1. Get or create system bot user ──────────────────────────
        bot, created = User.objects.get_or_create(
            username=BOT_USER,
            defaults={
                'first_name': 'ITPro',
                'last_name':  'Bot',
                'role':       'EMPLOYER',
                'is_active':  False,   # can't log in — system-only account
            },
        )
        if created:
            bot.set_unusable_password()
            bot.save()
            self.stdout.write(f'Created system user: {BOT_USER}')

        # ── 2. Fetch RSS ───────────────────────────────────────────────
        self.stdout.write(f'Fetching {RSS_URL} …')
        try:
            req = urllib.request.Request(
                RSS_URL,
                headers={'User-Agent': 'Mozilla/5.0 (compatible; CatalystJobBot/1.0)'},
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                xml_data = resp.read()
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f'Failed to fetch RSS: {exc}'))
            return

        # ── 3. Parse XML ───────────────────────────────────────────────
        try:
            root = ET.fromstring(xml_data)
        except ET.ParseError as exc:
            self.stderr.write(self.style.ERROR(f'Failed to parse XML: {exc}'))
            return

        items = root.findall('.//item')[:max_items]
        self.stdout.write(f'Found {len(items)} items in feed (max={max_items})')

        created_count = 0
        updated_count = 0
        skipped_count = 0

        for item in items:
            # ── Basic fields from standard RSS tags ───────────────────
            title       = (item.findtext('title') or '').strip()
            external_url = (item.findtext('link') or '').strip()
            pub_date    = (item.findtext('pubDate') or '').strip()

            if not title or not external_url:
                skipped_count += 1
                continue

            # ── Rich content from <content:encoded> ───────────────────
            encoded = item.find('content:encoded', NS)
            raw_html = encoded.text if encoded is not None else ''

            parsed = _parse_encoded(raw_html or '')

            # Strip " at CompanyName" suffix that ITPro appends to the title
            clean_title = re.sub(r'\s+at\s+.+$', '', title, flags=re.IGNORECASE).strip()
            company_name = parsed['company'] or re.search(r'\bat\s+(.+)$', title, re.IGNORECASE)
            if hasattr(company_name, 'group'):
                company_name = company_name.group(1).strip()
            else:
                company_name = company_name or 'ITPro.lk'

            # ── Resolve category ───────────────────────────────────────
            cat_name = _guess_category(external_url) or 'Engineering'
            category, _ = JobCategory.objects.get_or_create(name=cat_name)

            # ── Description fallback ───────────────────────────────────
            description = parsed['description'] or f'View full job description on ITPro.lk'

            # ── Save: update existing, create new ─────────────────────
            try:
                job = Job.objects.get(external_url=external_url)
                # Update description if the posting was refreshed
                job.description = description
                job.is_active   = True
                job.save(update_fields=['description', 'is_active'])
                updated_count += 1

            except Job.DoesNotExist:
                Job.objects.create(
                    title           = clean_title,
                    description     = description,
                    location        = parsed['location'],
                    job_type        = parsed['job_type'],
                    salary          = None,              # ITPro doesn't list salary in RSS
                    category        = category,
                    posted_by       = bot,
                    company         = bot,
                    is_active       = True,
                    is_external     = True,
                    external_source = 'itpro.lk',
                    external_url    = external_url,
                )
                created_count += 1
                self.stdout.write(f'  + {clean_title}  [{parsed["location"]}]')

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. Created: {created_count}  Updated: {updated_count}  Skipped: {skipped_count}'
        ))
        self.stdout.write(f'Total jobs in DB: {Job.objects.filter(is_active=True).count()}')
