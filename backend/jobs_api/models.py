from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class User(AbstractUser):
    class Role(models.TextChoices):
        EMPLOYER  = 'EMPLOYER',   'Employer'
        JOB_SEEKER = 'JOB_SEEKER', 'Job Seeker'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.JOB_SEEKER,
    )


class JobCategory(models.Model):
    name        = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class Company(models.Model):
    name        = models.CharField(max_length=150)
    website     = models.URLField(blank=True, null=True)
    location    = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class Job(models.Model):
    JOB_TYPES = (
        ('FULL_TIME', 'Full Time'),
        ('PART_TIME', 'Part Time'),
        ('REMOTE',    'Remote'),
        ('CONTRACT',  'Contract'),
    )

    title           = models.CharField(max_length=200)
    # company = the employer who posted the job (uses AUTH_USER_MODEL)
    company         = models.ForeignKey(
                          settings.AUTH_USER_MODEL,
                          on_delete=models.CASCADE,
                          null=True, blank=True,
                          related_name='company_jobs'
                      )
    category        = models.ForeignKey(
                          JobCategory,
                          on_delete=models.SET_NULL,
                          null=True,
                          related_name='jobs'
                      )
    location        = models.CharField(max_length=150)
    salary          = models.CharField(max_length=100, blank=True, null=True)
    job_type        = models.CharField(max_length=20, choices=JOB_TYPES, default='FULL_TIME')
    description     = models.TextField()
    posted_by       = models.ForeignKey(
                          settings.AUTH_USER_MODEL,
                          on_delete=models.CASCADE,
                          related_name='posted_jobs'
                      )
    created_at      = models.DateTimeField(auto_now_add=True)
    is_active       = models.BooleanField(default=True)
    is_external     = models.BooleanField(default=False)
    external_source = models.CharField(max_length=50, blank=True, null=True)
    external_url    = models.URLField(max_length=500, blank=True, null=True, unique=True)

    def __str__(self):
        return self.title


class Application(models.Model):
    class StatusChoices(models.TextChoices):
        PENDING  = 'PENDING',  'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        REJECTED = 'REJECTED', 'Rejected'

    job          = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    applicant    = models.ForeignKey(
                       settings.AUTH_USER_MODEL,
                       on_delete=models.CASCADE,
                       related_name='applications'
                   )
    resume       = models.FileField(upload_to='resumes/')
    cover_letter = models.TextField(blank=True, null=True)
    status       = models.CharField(
                       max_length=20,
                       choices=StatusChoices.choices,
                       default=StatusChoices.PENDING
                   )
    applied_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('job', 'applicant')

    def __str__(self):
        return f"{self.applicant.username} - {self.job.title}"
