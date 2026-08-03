from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from rest_framework_simplejwt.views import TokenObtainPairView
from .views import (
    JobViewSet,
    JobCategoryViewSet,
    CompanyViewSet,
    JobApplicationViewSet,
    RegisterView,
    LoginView,
)

router = DefaultRouter()
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'categories', JobCategoryViewSet, basename='category')
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'applications', JobApplicationViewSet, basename='application')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='token_obtain_pair'),
    path('', include(router.urls)),
]