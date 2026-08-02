from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    JobViewSet, 
    JobCategoryViewSet, 
    CompanyViewSet, 
    JobApplicationViewSet, 
    RegisterView
)

router = DefaultRouter()
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'categories', JobCategoryViewSet, basename='category')
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'applications', JobApplicationViewSet, basename='application')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('', include(router.urls)),
]