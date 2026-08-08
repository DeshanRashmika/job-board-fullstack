from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Job, JobCategory, Company, Application

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=6
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
            'id', 'title', 'description', 'salary', 'location',
            'job_type', 'category',
            'company', 'company_name',
            'is_active', 'created_at',
        ]
        read_only_fields = ['company', 'posted_by', 'created_at']


class ApplicationSerializer(serializers.ModelSerializer):
    applicant = serializers.ReadOnlyField(source='applicant.username')

    class Meta:
        model  = Application
        fields = '__all__'
