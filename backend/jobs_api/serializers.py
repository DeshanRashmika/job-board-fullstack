from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Job, JobCategory, Company, Application

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=6,
    )

    class Meta:
        model  = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class JobCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = JobCategory
        fields = '__all__'


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Company
        fields = '__all__'


class JobSerializer(serializers.ModelSerializer):
    # company is a FK to User (the employer). Return the human-readable username,
    # not just the numeric PK, so the frontend can display the company/poster name.
    company_name = serializers.ReadOnlyField(source='company.username')

    class Meta:
        model  = Job
        fields = [
            'id',
            'title',
            'description',
            'salary',
            'location',
            'job_type',
            'category',
            # company is the FK id (write); company_name is the display string (read)
            'company',
            'company_name',
            # external job fields — required so external listings can be imported
            'is_external',
            'external_url',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['company', 'posted_by', 'created_at']


class ApplicationSerializer(serializers.ModelSerializer):
    # Return applicant's username as a string instead of a PK
    applicant = serializers.ReadOnlyField(source='applicant.username')

    # Include the job title so the employer dashboard can show it
    # instead of the raw FK integer "Applied for Job #3"
    job_title = serializers.ReadOnlyField(source='job.title')

    class Meta:
        model  = Application
        fields = [
            'id',
            'job',
            'job_title',
            'applicant',
            'cover_letter',
            'status',
            'applied_at',
            'resume',
        ]
