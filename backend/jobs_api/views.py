from rest_framework import  viewsets, permissions, status
from .models import Application, Job, JobCategory, Company
from rest_framework.views import APIView
from rest_framework import generics, viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import viewsets, permissions, status
from .permissions import IsEmployer, IsEmployerAndOwnerOrReadOnly, IsOwnerOrReadOnly, IsJobSeeker
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import action
from rest_framework.response import Response

from .serializers import (
    ApplicationSerializer,
    JobSerializer,
    JobCategorySerializer,
    CompanySerializer,
    ApplicationSerializer,
    RegisterSerializer,
)

User = get_user_model()

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist() 
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"detail": "Invalid or expired refresh token."}, status=status.HTTP_400_BAD_REQUEST)


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'role') and user.role == 'employer':
            return Application.objects.filter(job__company__owner=user)
        return Application.objects.filter(applicant=user)

    def perform_create(self, serializer):
        serializer.save(applicant=self.request.user)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        application = self.get_object()
        
        if application.job.company.owner != request.user:
            return Response(
                {"detail": "You do not have permission to update this application status."},
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get('status')
        if new_status not in ['PENDING', 'ACCEPTED', 'REJECTED']:
            return Response(
                {"detail": "Invalid status option."},
                status=status.HTTP_400_BAD_REQUEST
            )

        application.status = new_status
        application.save()
        return Response({"detail": f"Application status updated to {new_status}."})
    
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

class LoginView(TokenObtainPairView):
    serializer_class = TokenObtainPairSerializer

class JobCategoryViewSet(viewsets.ModelViewSet):
    queryset = JobCategory.objects.all()
    serializer_class = JobCategorySerializer
    permission_classes = [AllowAny]


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [AllowAny]


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    permission_classes = [IsEmployerAndOwnerOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        
        if user.is_authenticated and getattr(user, 'role', None) == 'employer':
            if self.request.query_params.get('my_jobs') == 'true':
                return Job.objects.filter(company=user)
        
        return Job.objects.filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user)

    @action(detail=True, methods=['patch'], permission_classes=[IsEmployerAndOwnerOrReadOnly])
    def toggle_active(self, request, pk=None):
        job = self.get_object()
        job.is_active = not job.is_active
        job.save()
        
        status_msg = "activated" if job.is_active else "deactivated/hidden"
        return Response(
            {
                "detail": f"Job status successfully updated to {status_msg}.",
                "is_active": job.is_active
            },
            status=status.HTTP_200_OK
        )
class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else User.objects.first()
        serializer.save(applicant=user)