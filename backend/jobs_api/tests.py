from django.contrib.auth import get_user_model  # <-- get_user_model Import කරගන්න
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()

class JobAPITestCase(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='12345678')

    def test_get_all_jobs(self):
        response = self.client.get('/api/jobs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

def test_create_job(self):
        self.client.force_authenticate(user=self.user)
        
        data = {
            "title": "Software Engineer",
            "company": "Catalyst Software"
        }
        
        response = self.client.post('/api/jobs/', data, format='json')
        
        if response.status_code != status.HTTP_201_CREATED:
            print("\n❌ Validation Error Data:", response.data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)