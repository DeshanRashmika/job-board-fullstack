from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    JobViewSet,
    ApplicationViewSet,
    JobCategoryViewSet,
    CompanyViewSet,
    LogoutView,
    RegisterView,
    LoginView,
    FetchItproJobsView,
)

router = DefaultRouter()
router.register(r'jobs',         JobViewSet,         basename='job')
router.register(r'categories',   JobCategoryViewSet, basename='category')
router.register(r'companies',    CompanyViewSet,     basename='company')
router.register(r'applications', ApplicationViewSet, basename='application')

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(),  name='register'),
    path('auth/login/',    LoginView.as_view(),     name='login'),
    path('auth/logout/',   LogoutView.as_view(),    name='logout'),

    # External job fetch trigger
    path('jobs/fetch-itpro/', FetchItproJobsView.as_view(), name='fetch-itpro'),

    # ViewSet routes (jobs, categories, companies, applications)
    path('', include(router.urls)),
]
