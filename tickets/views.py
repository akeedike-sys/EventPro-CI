from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import TicketType, Reservation
from .serializers import (
    TicketTypeSerializer,
    ReservationListSerializer,
    ReservationDetailSerializer,
    ReservationCreateSerializer,
)

class TicketTypeViewSet(viewsets.ModelViewSet):
    queryset = TicketType.objects.all()
    serializer_class = TicketTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]
    
    def create(self, request, *args, **kwargs):
        """Créer un type de billet (organisateur seulement)"""
        event_id = request.data.get('event')
        
        try:
            event = __import__('events.models', fromlist=['Event']).Event.objects.get(id=event_id)
        except:
            return Response(
                {'detail': 'Événement non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if event.organizer != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'Vous n\'avez pas la permission de créer des billets pour cet événement.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().create(request, *args, **kwargs)
    
    def get_queryset(self):
        """Filtrer par événement si spécifié"""
        queryset = TicketType.objects.all()
        event_id = self.request.query_params.get('event')
        
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        return queryset.order_by('created_at')

class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReservationCreateSerializer
        elif self.action == 'retrieve':
            return ReservationDetailSerializer
        return ReservationListSerializer
    
    def get_queryset(self):
        """Les utilisateurs ne voient que leurs réservations"""
        self._clean_expired_locks()
        if self.request.user.is_staff or self.request.user.is_organizer:
            return Reservation.objects.all().order_by('-created_at')
        return Reservation.objects.filter(user=self.request.user).order_by('-created_at')
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Créer une nouvelle réservation (avec verrouillage anti-race-condition)"""
        if request.user.is_organizer:
            return Response(
                {'detail': 'Les organisateurs ne peuvent pas acheter de billets.'},
                status=status.HTTP_403_FORBIDDEN
            )

        ticket_type_id = request.data.get('ticket_type')
        quantity = int(request.data.get('quantity', 1))

        if ticket_type_id:
            tt = TicketType.objects.select_for_update().get(id=ticket_type_id)
            if tt.available < quantity:
                return Response(
                    {'detail': f'Seulement {tt.available} billet(s) disponible(s).'},
                    status=status.HTTP_409_CONFLICT
                )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reservation = serializer.save()

        self._notify_reservation_created(reservation)

        return Response(
            ReservationDetailSerializer(reservation).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Annuler une réservation"""
        reservation = self.get_object()
        
        if reservation.user != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'Vous n\'avez pas la permission d\'annuler cette réservation.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if reservation.is_cancelled:
            return Response(
                {'detail': 'Cette réservation est déjà annulée.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.cancel()
        
        # Notifier via WebSocket
        self._notify_reservation_cancelled(reservation)
        
        return Response(
            ReservationDetailSerializer(reservation).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        """Paiement fictif d'une réservation"""
        reservation = self.get_object()

        if reservation.user != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'Vous n\'avez pas la permission.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if reservation.is_cancelled:
            return Response(
                {'detail': 'Cette réservation est annulée.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if reservation.payment_status == 'paid':
            return Response(
                {'detail': 'Cette réservation est déjà payée.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if reservation.expires_at and reservation.expires_at < timezone.now():
            reservation.cancel()
            return Response(
                {'detail': 'Le délai de réservation a expiré. Veuillez refaire une réservation.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reservation.payment_status = 'paid'
        reservation.status = 'confirmed'
        reservation.save()

        self._notify_reservation_paid(reservation)

        return Response(
            ReservationDetailSerializer(reservation).data,
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def my_reservations(self, request):
        """Lister les réservations de l'utilisateur connecté"""
        if request.user.is_organizer:
            return Response([])
        reservations = Reservation.objects.filter(user=request.user).order_by('-created_at')
        serializer = ReservationListSerializer(reservations, many=True)
        return Response(serializer.data)
    
    def _notify_reservation_created(self, reservation):
        """Envoyer une notification WebSocket"""
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'event_{reservation.event.id}',
            {
                'type': 'reservation_update',
                'message': {
                    'reservation_id': str(reservation.id),
                    'event_id': reservation.event.id,
                    'ticket_code': reservation.ticket_code,
                    'action': 'created',
                    'available_seats': reservation.event.available_seats,
                }
            }
        )

    def _notify_reservation_paid(self, reservation):
        """Envoyer une notification de paiement"""
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'event_{reservation.event.id}',
            {
                'type': 'reservation_update',
                'message': {
                    'reservation_id': str(reservation.id),
                    'event_id': reservation.event.id,
                    'ticket_code': reservation.ticket_code,
                    'action': 'paid',
                    'available_seats': reservation.event.available_seats,
                }
            }
        )

    def _notify_reservation_cancelled(self, reservation):
        """Envoyer une notification d'annulation"""
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'event_{reservation.event.id}',
            {
                'type': 'reservation_update',
                'message': {
                    'reservation_id': str(reservation.id),
                    'event_id': reservation.event.id,
                    'ticket_code': reservation.ticket_code,
                    'action': 'cancelled',
                    'available_seats': reservation.event.available_seats,
                }
            }
        )

    def _clean_expired_locks(self):
        """Auto-annuler les locks temporaires expirés"""
        expired = Reservation.objects.filter(
            expires_at__lt=timezone.now(),
            payment_status='pending',
            is_cancelled=False
        )
        for res in expired:
            res.cancel()
