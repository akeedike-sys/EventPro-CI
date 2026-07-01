from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from .models import TicketType, Reservation

class TicketTypeSerializer(serializers.ModelSerializer):
    available = serializers.IntegerField(read_only=True)
    is_sold_out = serializers.BooleanField(read_only=True)
    type_name_display = serializers.CharField(source='get_type_name_display', read_only=True)
    
    class Meta:
        model = TicketType
        fields = ['id', 'event', 'type_name', 'type_name_display', 'price', 'quota', 'sold', 'available', 'is_sold_out', 'created_at']
        read_only_fields = ['id', 'sold', 'created_at']

class ReservationListSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    ticket_type_display = serializers.CharField(source='ticket_type.get_type_name_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    
    class Meta:
        model = Reservation
        fields = ['id', 'ticket_code', 'user_email', 'event', 'event_title', 'ticket_type', 
                  'ticket_type_display', 'quantity', 'total_price', 'status', 'status_display',
                  'payment_status', 'payment_status_display', 'expires_at', 'created_at']
        read_only_fields = ['id', 'ticket_code', 'expires_at', 'created_at']

class ReservationDetailSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    event_date = serializers.DateTimeField(source='event.date_start', read_only=True)
    ticket_type_display = serializers.CharField(source='ticket_type.get_type_name_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    
    class Meta:
        model = Reservation
        fields = ['id', 'ticket_code', 'user_email', 'event', 'event_title', 'event_date',
                  'ticket_type', 'ticket_type_display', 'quantity', 'total_price', 'status',
                  'status_display', 'payment_status', 'payment_status_display',
                  'expires_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'ticket_code', 'expires_at', 'created_at', 'updated_at']

class ReservationCreateSerializer(serializers.ModelSerializer):
    quantity = serializers.IntegerField(min_value=1, default=1)
    
    class Meta:
        model = Reservation
        fields = ['event', 'ticket_type', 'quantity']
    
    def validate(self, data):
        ticket_type = data.get('ticket_type')
        quantity = data.get('quantity')
        
        if ticket_type.available < quantity:
            raise serializers.ValidationError(
                f'Seulement {ticket_type.available} billet(s) disponible(s).'
            )
        
        return data
    
    def create(self, validated_data):
        user = self.context['request'].user
        ticket_type = validated_data['ticket_type']
        quantity = validated_data['quantity']
        
        # Calculer le prix total
        total_price = ticket_type.price * quantity
        
        # Créer la réservation avec lock temporaire de 10 min
        reservation = Reservation.objects.create(
            user=user,
            event=validated_data['event'],
            ticket_type=ticket_type,
            quantity=quantity,
            total_price=total_price,
            status='pending',
            payment_status='pending',
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        
        # Mettre à jour les billets vendus
        ticket_type.sold += quantity
        ticket_type.save()
        
        return reservation
