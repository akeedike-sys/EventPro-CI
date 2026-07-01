from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
import uuid

User = get_user_model()

class TicketType(models.Model):
    TICKET_TYPE_CHOICES = (
        ('standard', 'Standard'),
        ('vip', 'VIP'),
        ('student', 'Étudiant'),
    )
    
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='ticket_types',
        help_text='Événement associé'
    )
    type_name = models.CharField(
        max_length=20,
        choices=TICKET_TYPE_CHOICES,
        help_text='Type de billet'
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text='Prix du billet'
    )
    quota = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text='Nombre de billets disponibles'
    )
    sold = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Nombre de billets vendus'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tickets_tickettype'
        verbose_name = 'Type de billet'
        verbose_name_plural = 'Types de billets'
        unique_together = ('event', 'type_name')
        indexes = [
            models.Index(fields=['event', 'type_name']),
        ]
    
    def __str__(self):
        return f"{self.event.title} - {self.get_type_name_display()}"
    
    @property
    def available(self):
        """Nombre de billets disponibles"""
        return self.quota - self.sold
    
    @property
    def is_sold_out(self):
        """Vérifier si tous les billets sont vendus"""
        return self.available <= 0

class Reservation(models.Model):
    STATUS_CHOICES = (
        ('pending', 'En attente'),
        ('confirmed', 'Confirmée'),
        ('cancelled', 'Annulée'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reservations',
        help_text='Utilisateur qui a réservé'
    )
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='reservations',
        help_text='Événement réservé'
    )
    ticket_type = models.ForeignKey(
        TicketType,
        on_delete=models.CASCADE,
        related_name='reservations',
        help_text='Type de billet réservé'
    )
    ticket_code = models.CharField(
        max_length=100,
        unique=True,
        editable=False,
        help_text='Code unique du billet'
    )
    quantity = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text='Nombre de billets réservés'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text='Statut de la réservation'
    )
    is_cancelled = models.BooleanField(
        default=False,
        help_text='Réservation annulée'
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text='Prix total de la réservation'
    )
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'En attente'),
            ('paid', 'Payé'),
            ('refunded', 'Remboursé'),
        ],
        default='pending',
        help_text='Statut du paiement'
    )
    expires_at = models.DateTimeField(
        null=True, blank=True,
        help_text="Date d'expiration du lock temporaire"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tickets_reservation'
        verbose_name = 'Réservation'
        verbose_name_plural = 'Réservations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'event']),
            models.Index(fields=['event', 'status']),
            models.Index(fields=['ticket_code']),
        ]
    
    def __str__(self):
        return f"Réservation {self.ticket_code} - {self.user.email}"
    
    def save(self, *args, **kwargs):
        if not self.ticket_code:
            self.ticket_code = f"{self.event.id}-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)
    
    def cancel(self):
        """Annuler la réservation"""
        if not self.is_cancelled:
            self.is_cancelled = True
            self.status = 'cancelled'
            self.payment_status = 'refunded'
            self.save()
            
            # Libérer les billets
            self.ticket_type.sold = max(0, self.ticket_type.sold - self.quantity)
            self.ticket_type.save()
