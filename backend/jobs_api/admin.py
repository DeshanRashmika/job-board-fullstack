from django.contrib import admin
from .models import User, Company, JobCategory, Job, JobApplication

admin.site.register(User)
admin.site.register(Company)
admin.site.register(JobCategory)
admin.site.register(Job)
admin.site.register(JobApplication)