from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Event
from .serializers import EventListSerializer, EventDetailSerializer, EventCreateUpdateSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'upcoming']:
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return EventCreateUpdateSerializer
        elif self.action == 'retrieve':
            return EventDetailSerializer
        return EventListSerializer
    
    def get_queryset(self):
        """Filtrer les événements selon l'utilisateur"""
        user = self.request.user
        
        if self.action == 'upcoming':
            return Event.objects.filter(status='published')
        
        if not user.is_authenticated:
            return Event.objects.filter(status='published')
        
        queryset = Event.objects.all()
        
        # Les organisateurs ne voient que leurs événements
        if not user.is_staff:
            if user.is_organizer:
                queryset = queryset.filter(organizer=user)
        
        return queryset.order_by('-date_start')
    
    def create(self, request, *args, **kwargs):
        """Créer un nouvel événement"""
        if not request.user.is_organizer and not request.user.is_staff:
            return Response(
                {'detail': 'Seuls les organisateurs peuvent créer des événements.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.save(organizer=request.user)
        
        return Response(
            EventDetailSerializer(event).data,
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """Mettre à jour un événement"""
        event = self.get_object()
        if event.organizer != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'Vous n\'avez pas la permission de modifier cet événement.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Supprimer un événement"""
        event = self.get_object()
        if event.organizer != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'Vous n\'avez pas la permission de supprimer cet événement.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publier un événement"""
        event = self.get_object()
        
        if event.organizer != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'Vous n\'avez pas la permission de publier cet événement.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if event.status != 'draft':
            return Response(
                {'detail': 'Seuls les brouillons peuvent être publiés.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        event.status = 'published'
        event.save()
        
        # Notifier via WebSocket
        self._notify_event_change(event, 'published')
        
        return Response(
            EventDetailSerializer(event).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Annuler un événement et libérer les réservations"""
        event = self.get_object()
        
        if event.organizer != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'Vous n\'avez pas la permission d\'annuler cet événement.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        event.status = 'cancelled'
        event.save()
        
        # Annuler les réservations actives
        from tickets.models import Reservation
        active = Reservation.objects.filter(event=event, is_cancelled=False)
        for res in active:
            res.cancel()
            self._notify_reservation_cancelled(res)
        
        # Notifier via WebSocket
        self._notify_event_change(event, 'cancelled')
        
        return Response(
            EventDetailSerializer(event).data,
            status=status.HTTP_200_OK
        )
    
    def _notify_reservation_cancelled(self, reservation):
        """Envoyer une notification d'annulation de réservation"""
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
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
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Lister les événements à venir"""
        now = timezone.now()
        events = Event.objects.filter(
            date_start__gte=now,
            status='published'
        ).order_by('date_start')
        
        serializer = EventListSerializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_events(self, request):
        """Lister les événements de l'utilisateur connecté"""
        if not request.user.is_organizer:
            return Response(
                {'detail': 'Seuls les organisateurs ont des événements.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        events = Event.objects.filter(organizer=request.user).order_by('-date_start')
        serializer = EventListSerializer(events, many=True)
        return Response(serializer.data)
    
    def _notify_event_change(self, event, action):
        """Envoyer une notification WebSocket"""
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'event_{event.id}',
            {
                'type': 'event_update',
                'message': {
                    'event_id': event.id,
                    'title': event.title,
                    'status': event.status,
                    'action': action,
                    'available_seats': event.available_seats,
                }
            }
        )
