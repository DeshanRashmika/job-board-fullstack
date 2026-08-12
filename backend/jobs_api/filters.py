import django_filters
from .models import Job


class JobFilter(django_filters.FilterSet):
    # Text-based search on title and location (case-insensitive)
    title    = django_filters.CharFilter(lookup_expr='icontains')
    location = django_filters.CharFilter(lookup_expr='icontains')

    # salary is a CharField (e.g. "$80k – $100k"), so filter by partial text,
    # NOT by NumberFilter (which would crash on a string DB column).
    salary = django_filters.CharFilter(lookup_expr='icontains')

    # Exact match on the job_type choices field, so the frontend ?job_type=REMOTE works
    job_type = django_filters.CharFilter(lookup_expr='exact')

    class Meta:
        model  = Job
        fields = ['title', 'location', 'salary', 'job_type']
