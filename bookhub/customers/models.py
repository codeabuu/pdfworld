from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    AUTH_PROVIDERS = [
        ('email', 'Email'),
        ('google', 'Google'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    supabase_id = models.CharField(max_length=255, unique=True)
    auth_provider = models.CharField(max_length=20, choices=AUTH_PROVIDERS, default='email')
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email} ({self.auth_provider})"