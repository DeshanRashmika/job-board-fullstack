from rest_framework import generics, viewsets, filters, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from django.core.management import call_command
from io import StringIO

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


# ── Pagination ────────────────────────────────────────────────────────

class JobPagination(PageNumberPagination):
    """
    15 jobs per page for the public job listings.
    Returns: { count, total_pages, next, previous, results }
    """
    page_size             = 15
    page_size_query_param = 'page_size'   # allow ?page_size=N override if needed
    max_page_size         = 100
    page_query_param      = 'page'        # ?page=2

    def get_paginated_response(self, data):
        return Response({
            'count':       self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'next':        self.get_next_link(),
            'previous':    self.get_previous_link(),
            'results':     data,
        })


# ── Auth ─────────────────────────────────────────────────────────────

class CustomTokenSerializer(TokenObtainPairSerializer):
    """Extend the default JWT response to include username and role."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data['username'] = self.user.username
        data['role']     = getattr(self.user, 'role', '')
        return data


class RegisterView(generics.CreateAPIView):
    queryset           = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class   = RegisterSerializer


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer


class LogoutView(APIView):
    """
    Blacklist the submitted refresh token.
    Uses AllowAny — the refresh token is the credential, not the access token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'detail': 'Successfully logged out.'},
                status=status.HTTP_205_RESET_CONTENT,
            )
        except Exception:
            return Response(
                {'detail': 'Invalid or expired refresh token.'},
                status=status.HTTP_400_BAD_REQUEST,
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

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = JobFilter
    search_fields   = ['title', 'description', 'location']
    ordering_fields = ['created_at', 'salary']
    ordering        = ['-created_at']

    def get_paginator(self):
        """
        Only paginate the public listing (is_active jobs).
        The employer's ?my_jobs=true dashboard view returns all their jobs unpaginated
        so the dashboard table doesn't need page controls.
        """
        if self.request.query_params.get('my_jobs') == 'true':
            return None
        return JobPagination()

    def get_queryset(self):
        user = self.request.user
        if (
            user.is_authenticated
            and getattr(user, 'role', None) == 'EMPLOYER'
            and self.request.query_params.get('my_jobs') == 'true'
        ):
            return Job.objects.filter(posted_by=user)
        return Job.objects.filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user,
            posted_by=self.request.user,
        )

    @action(detail=True, methods=['patch'], permission_classes=[IsEmployerAndOwnerOrReadOnly])
    def toggle_active(self, request, pk=None):
        job = self.get_object()
        job.is_active = not job.is_active
        job.save()
        msg = 'activated' if job.is_active else 'deactivated'
        return Response(
            {'detail': f'Job {msg}.', 'is_active': job.is_active},
            status=status.HTTP_200_OK,
        )


# ── Applications ─────────────────────────────────────────────────────

class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class   = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'EMPLOYER':
            return Application.objects.filter(
                job__posted_by=user
            ).select_related('job', 'applicant')
        return Application.objects.filter(applicant=user).select_related('job')

    def perform_create(self, serializer):
        serializer.save(applicant=self.request.user)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        application = self.get_object()

        if application.job.posted_by != request.user:
            return Response(
                {'detail': 'You do not have permission to update this application.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_status = request.data.get('status')
        if new_status not in ['PENDING', 'ACCEPTED', 'REJECTED']:
            return Response(
                {'detail': 'Invalid status. Choose PENDING, ACCEPTED, or REJECTED.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        application.status = new_status
        application.save()
        return Response({'detail': f'Status updated to {new_status}.'})



# ── ITPro.lk Job Fetcher ──────────────────────────────────────────────

class FetchItproJobsView(APIView):
    """
    POST /api/jobs/fetch-itpro/
    Triggers the fetch_itpro_jobs management command and returns a summary.
    Open to all (AllowAny) so it can also be called by a cron/scheduler
    without needing auth tokens.  In production you would protect this
    with a secret header or restrict to staff only.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        max_items = int(request.data.get('max', 50))
        out = StringIO()
        try:
            call_command('fetch_itpro_jobs', max=max_items, stdout=out, stderr=out)
            return Response(
                {'detail': 'Fetch complete.', 'log': out.getvalue()},
                status=status.HTTP_200_OK,
            )
        except Exception as exc:
            return Response(
                {'detail': f'Fetch failed: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
