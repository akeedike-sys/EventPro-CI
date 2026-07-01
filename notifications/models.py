from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = (
        ('event_published', 'Événement publié'),
        ('event_cancelled', 'Événement annulé'),
        ('event_updated', 'Événement mis à jour'),
        ('reservation_confirmed', 'Réservation confirmée'),
        ('reservation_cancelled', 'Réservation annulée'),
        ('seats_updated', 'Places mises à jour'),
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text='Destinataire de la notification'
    )
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        help_text='Événement concerné'
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPE_CHOICES,
        help_text='Type de notification'
    )
    title = models.CharField(
        max_length=200,
        help_text='Titre de la notification'
    )
    message = models.TextField(
        help_text='Contenu de la notification'
    )
    is_read = models.BooleanField(
        default=False,
        help_text='Notification lue'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications_notification'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    @classmethod
    def create_notification(cls, user, event, notification_type, title, message):
        """Créer une notification"""
        return cls.objects.create(
            user=user,
            event=event,
            notification_type=notification_type,
            title=title,
            message=message
        )
