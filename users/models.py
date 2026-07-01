from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import EmailValidator

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrateur'),
        ('organizer', 'Organisateur'),
        ('participant', 'Participant'),
    )

    username = models.CharField(
        max_length=150,
        unique=True,
        default='',
        help_text='Utilisé en interne (copie de l\'email)'
    )
    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='participant',
        help_text='Rôle de l\'utilisateur dans la plateforme'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text='Numéro de téléphone'
    )
    bio = models.TextField(
        blank=True,
        null=True,
        help_text='Biographie courte'
    )
    profile_image = models.ImageField(
        upload_to='profile_images/',
        blank=True,
        null=True,
        help_text='Photo de profil'
    )
    is_verified = models.BooleanField(
        default=False,
        help_text='Compte vérifié par email'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users_user'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
    
    @property
    def is_organizer(self):
        return self.role == 'organizer'
    
    @property
    def is_admin_user(self):
        return self.role == 'admin' or self.is_staff
