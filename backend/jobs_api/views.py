from rest_framework import generics, viewsets, filters, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model

# Relative imports — no 'backend.' prefix
from .filters import JobFilter
from .models import Application, Job, JobCategory, Company
from .permissions import IsEmployerAndOwnerOrReadOnly
from .serializers import (
    ApplicationSerializer,
    JobSerializer,
    JobCategorySerializer,
    CompanySerializer,
    RegisterSerializer,
)

User = get_user_model()


# ── Auth ─────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    queryset           = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class   = RegisterSerializer


class LoginView(TokenObtainPairView):
    serializer_class = TokenObtainPairSerializer


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"detail": "Successfully logged out."},
                status=status.HTTP_205_RESET_CONTENT
            )
        except Exception:
            return Response(
                {"detail": "Invalid or expired refresh token."},
                status=status.HTTP_400_BAD_REQUEST
            )


# ── Jobs ─────────────────────────────────────────────────────────────

class JobCategoryViewSet(viewsets.ModelViewSet):
    queryset           = JobCategory.objects.all()
    serializer_class   = JobCategorySerializer
    permission_classes = [AllowAny]


class CompanyViewSet(viewsets.ModelViewSet):
    queryset           = Company.objects.all()
    serializer_class   = CompanySerializer
    permission_classes = [AllowAny]


class JobViewSet(viewsets.ModelViewSet):
    serializer_class   = JobSerializer
    permission_classes = [IsEmployerAndOwnerOrReadOnly]

    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class  = JobFilter
    search_fields    = ['title', 'description', 'location']
    ordering_fields  = ['created_at', 'salary']
    ordering         = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and getattr(user, 'role', None) == 'EMPLOYER':
            if self.request.query_params.get('my_jobs') == 'true':
                return Job.objects.filter(company=user)
        return Job.objects.filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user, posted_by=self.request.user)

    @action(detail=True, methods=['patch'], permission_classes=[IsEmployerAndOwnerOrReadOnly])
    def toggle_active(self, request, pk=None):
        job = self.get_object()
        job.is_active = not job.is_active
        job.save()
        status_msg = "activated" if job.is_active else "deactivated"
        return Response(
            {"detail": f"Job {status_msg}.", "is_active": job.is_active},
            status=status.HTTP_200_OK
        )


# ── Applications ─────────────────────────────────────────────────────

class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class   = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'EMPLOYER':
            return Application.objects.filter(job__company=user)
        return Application.objects.filter(applicant=user)

    def perform_create(self, serializer):
        serializer.save(applicant=self.request.user)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        application = self.get_object()

        if application.job.company != request.user:
            return Response(
                {"detail": "You do not have permission to update this application."},
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get('status')
        if new_status not in ['PENDING', 'ACCEPTED', 'REJECTED']:
            return Response(
                {"detail": "Invalid status. Choose PENDING, ACCEPTED, or REJECTED."},
                status=status.HTTP_400_BAD_REQUEST
            )

        application.status = new_status
        application.save()
        return Response({"detail": f"Status updated to {new_status}."})
