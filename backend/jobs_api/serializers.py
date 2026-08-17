from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Job, JobCategory, Company, Application
from .supabase_client import upload_resume_to_supabase

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
            'company',
            'company_name',
            'is_external',
            'external_url',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['company', 'posted_by', 'created_at']


class ApplicationSerializer(serializers.ModelSerializer):
    applicant = serializers.ReadOnlyField(source='applicant.username')
    job_title = serializers.ReadOnlyField(source='job.title')
    resume = serializers.FileField(write_only=True, required=True)

    class Meta:
        model  = Application
        fields = [
            'id', 'job', 'job_title', 'applicant', 'cover_letter',
            'status', 'applied_at', 'resume', 'resume_url',
        ]
        read_only_fields = ['resume_url']

    def create(self, validated_data):
        resume_file = validated_data.pop('resume')
        validated_data['resume_url'] = upload_resume_to_supabase(resume_file)
        return super().create(validated_data)
