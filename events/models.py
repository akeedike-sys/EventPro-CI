from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.db.models import Sum

User = get_user_model()

class Event(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Brouillon'),
        ('published', 'Publié'),
        ('cancelled', 'Annulé'),
        ('completed', 'Terminé'),
    )
    
    title = models.CharField(
        max_length=200,
        help_text='Titre de l\'événement'
    )
    description = models.TextField(
        help_text='Description détaillée de l\'événement'
    )
    organizer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='organized_events',
        help_text='Organisateur de l\'événement'
    )
    date_start = models.DateTimeField(
        help_text='Date et heure de début'
    )
    date_end = models.DateTimeField(
        help_text='Date et heure de fin'
    )
    location = models.CharField(
        max_length=300,
        help_text='Lieu de l\'événement'
    )
    max_capacity = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text='Nombre maximum de participants'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        help_text='Statut de l\'événement'
    )
    image = models.ImageField(
        upload_to='event_images/',
        blank=True,
        null=True,
        help_text='Image de couverture'
    )
    category = models.CharField(
        max_length=50,
        choices=[
            ('cultural', 'Culturel'),
            ('sports', 'Sportif'),
            ('professional', 'Professionnel'),
            ('other', 'Autre'),
        ],
        default='other',
        help_text='Catégorie de l\'événement'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'events_event'
        verbose_name = 'Événement'
        verbose_name_plural = 'Événements'
        ordering = ['-date_start']
        indexes = [
            models.Index(fields=['organizer', 'status']),
            models.Index(fields=['date_start']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.date_start.strftime('%d/%m/%Y')}"
    
    @property
    def available_seats(self):
        """Nombre de places disponibles"""
        from tickets.models import Reservation
        sold = Reservation.objects.filter(event=self, is_cancelled=False).aggregate(Sum('quantity'))['quantity__sum'] or 0
        return self.max_capacity - sold
    
    @property
    def min_price(self):
        from tickets.models import TicketType
        first = self.ticket_types.order_by('price').first()
        return float(first.price) if first else None

    @property
    def is_ongoing(self):
        """L'événement est en cours"""
        now = timezone.now()
        return self.date_start <= now <= self.date_end
    
    @property
    def is_passed(self):
        """L'événement est passé"""
        return timezone.now() > self.date_end
