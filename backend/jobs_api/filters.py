import django_filters
from .models import Job

class JobFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(lookup_expr='icontains')      
    location = django_filters.CharFilter(lookup_expr='icontains')   
    min_salary = django_filters.NumberFilter(field_name='salary', lookup_expr='gte') 
    max_salary = django_filters.NumberFilter(field_name='salary', lookup_expr='lte') 

    class Meta:
        model = Job
        fields = ['title', 'location', 'min_salary', 'max_salary']