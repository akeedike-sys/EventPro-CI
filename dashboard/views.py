from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.contrib.auth import get_user_model
from events.models import Event
from tickets.models import Reservation, TicketType

User = get_user_model()

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def organizer_stats(self, request):
        """Statistiques du tableau de bord organisateur"""
        if not request.user.is_organizer and not request.user.is_staff:
            return Response(
                {'detail': 'Seuls les organisateurs peuvent accéder au tableau de bord.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Récupérer les événements de l'organisateur
        events = Event.objects.filter(organizer=request.user)
        
        # Statistiques globales
        total_events = events.count()
        published_events = events.filter(status='published').count()
        cancelled_events = events.filter(status='cancelled').count()
        
        # Billets vendus (somme des quantités)
        total_reservations = Reservation.objects.filter(
            event__organizer=request.user,
            is_cancelled=False
        ).aggregate(total=Sum('quantity'))['total'] or 0
        
        # Recettes
        total_revenue = Reservation.objects.filter(
            event__organizer=request.user,
            is_cancelled=False,
            payment_status='paid'
        ).aggregate(total=Sum('total_price'))['total'] or 0
        
        # Taux de remplissage
        total_capacity = events.aggregate(Sum('max_capacity'))['max_capacity__sum'] or 0
        
        # Total des billets vendus (somme des quantités)
        tickets_sold_agg = Reservation.objects.filter(
            event__organizer=request.user,
            is_cancelled=False
        ).aggregate(total=Sum('quantity'))
        total_tickets_sold = tickets_sold_agg['total'] or 0
        
        # Taux de remplissage global
        fill_rate = round((total_tickets_sold / total_capacity * 100), 1) if total_capacity > 0 else 0
        
        # Activité récente (10 dernières réservations)
        recent = Reservation.objects.filter(
            event__organizer=request.user
        ).select_related('user', 'ticket_type', 'event').order_by('-created_at')[:10]
        
        recent_reservations = []
        for r in recent:
            recent_reservations.append({
                'id': str(r.id),
                'participant_name': r.user.get_full_name() or r.user.email,
                'participant_email': r.user.email,
                'event_title': r.event.title,
                'ticket_type': r.ticket_type.get_type_name_display(),
                'quantity': r.quantity,
                'total_price': float(r.total_price),
                'payment_status': r.get_payment_status_display(),
                'created_at': r.created_at.isoformat(),
            })
        
        stats = {
            'total_events': total_events,
            'published_events': published_events,
            'cancelled_events': cancelled_events,
            'total_reservations': total_reservations,
            'total_tickets_sold': total_tickets_sold,
            'total_revenue': float(total_revenue),
            'total_capacity': total_capacity,
            'fill_rate': fill_rate,
            'recent_reservations': recent_reservations,
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def event_details(self, request):
        """Détails statistiques par événement"""
        event_id = request.query_params.get('event_id')
        
        if not event_id:
            return Response(
                {'detail': 'event_id est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response(
                {'detail': 'Événement non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if event.organizer != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'Vous n\'avez pas la permission de voir ces statistiques.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Statistiques par type de billet
        ticket_stats = []
        for ticket_type in event.ticket_types.all():
            reservations = Reservation.objects.filter(
                ticket_type=ticket_type,
                is_cancelled=False
            )
            
            revenue = reservations.filter(
                payment_status='paid'
            ).aggregate(Sum('total_price'))['total_price__sum'] or 0
            
            ticket_stats.append({
                'type': ticket_type.get_type_name_display(),
                'quota': ticket_type.quota,
                'sold': ticket_type.sold,
                'available': ticket_type.available,
                'price': float(ticket_type.price),
                'revenue': float(revenue),
            })
        
        # Statut des paiements (somme des quantités)
        payment_stats = {
            'pending': Reservation.objects.filter(
                event=event,
                payment_status='pending',
                is_cancelled=False
            ).aggregate(total=Sum('quantity'))['total'] or 0,
            'paid': Reservation.objects.filter(
                event=event,
                payment_status='paid',
                is_cancelled=False
            ).aggregate(total=Sum('quantity'))['total'] or 0,
            'refunded': Reservation.objects.filter(
                event=event,
                payment_status='refunded'
            ).aggregate(total=Sum('quantity'))['total'] or 0,
        }
        
        # Total des participants
        total_participants = Reservation.objects.filter(
            event=event,
            is_cancelled=False
        ).values('user').distinct().count()
        
        # Total des billets vendus
        total_tickets_sold = Reservation.objects.filter(
            event=event,
            is_cancelled=False
        ).aggregate(Sum('quantity'))['quantity__sum'] or 0
        
        # Recettes totales
        total_revenue = Reservation.objects.filter(
            event=event,
            is_cancelled=False,
            payment_status='paid'
        ).aggregate(Sum('total_price'))['total_price__sum'] or 0
        
        stats = {
            'event_id': event.id,
            'event_title': event.title,
            'total_participants': total_participants,
            'total_tickets_sold': total_tickets_sold,
            'total_revenue': float(total_revenue),
            'ticket_breakdown': ticket_stats,
            'payment_status': payment_stats,
            'capacity_usage': {
                'max_capacity': event.max_capacity,
                'reserved': total_tickets_sold,
                'percentage': round((total_tickets_sold / event.max_capacity * 100) if event.max_capacity > 0 else 0, 2),
            }
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def event_participants(self, request):
        """Liste des participants d'un événement"""
        event_id = request.query_params.get('event_id')
        
        if not event_id:
            return Response(
                {'detail': 'event_id est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response(
                {'detail': 'Événement non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if event.organizer != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'Vous n\'avez pas la permission de voir ces données.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reservations = Reservation.objects.filter(
            event=event,
            is_cancelled=False
        ).select_related('user', 'ticket_type').order_by('-created_at')
        
        participants = []
        for reservation in reservations:
            participants.append({
                'reservation_id': str(reservation.id),
                'ticket_code': reservation.ticket_code,
                'participant_email': reservation.user.email,
                'participant_name': reservation.user.get_full_name() or reservation.user.email,
                'ticket_type': reservation.ticket_type.get_type_name_display(),
                'quantity': reservation.quantity,
                'total_price': float(reservation.total_price),
                'payment_status': reservation.get_payment_status_display(),
                'reservation_date': reservation.created_at.isoformat(),
            })
        
        return Response({
            'event_id': event.id,
            'event_title': event.title,
            'total_participants': len(participants),
            'participants': participants,
        })
    
    @action(detail=False, methods=['get'])
    def platform_stats(self, request):
        """Statistiques globales de la plateforme (admin seulement)"""
        if not request.user.is_staff:
            return Response(
                {'detail': 'Seuls les administrateurs peuvent accéder à ces statistiques.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        total_users = User.objects.count()
        total_events = Event.objects.count()
        total_reservations = Reservation.objects.filter(is_cancelled=False).count()
        total_revenue = Reservation.objects.filter(
            is_cancelled=False,
            payment_status='paid'
        ).aggregate(Sum('total_price'))['total_price__sum'] or 0
        
        events_by_status = {
            'draft': Event.objects.filter(status='draft').count(),
            'published': Event.objects.filter(status='published').count(),
            'cancelled': Event.objects.filter(status='cancelled').count(),
            'completed': Event.objects.filter(status='completed').count(),
        }
        
        events_by_category = {
            'cultural': Event.objects.filter(category='cultural').count(),
            'sports': Event.objects.filter(category='sports').count(),
            'professional': Event.objects.filter(category='professional').count(),
            'other': Event.objects.filter(category='other').count(),
        }
        
        users_by_role_qs = User.objects.values('role').annotate(count=Count('id'))
        users_by_role = {item['role']: item['count'] for item in users_by_role_qs}
        
        recent_users_qs = User.objects.order_by('-created_at')[:10]
        recent_users = [{
            'id': u.id,
            'email': u.email,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'role': u.role,
            'role_display': u.get_role_display(),
            'created_at': u.created_at.isoformat(),
        } for u in recent_users_qs]
        
        recent_reservations_qs = Reservation.objects.filter(
            is_cancelled=False
        ).select_related('user', 'event', 'ticket_type').order_by('-created_at')[:10]
        recent_reservations = [{
            'id': str(r.id),
            'participant_name': r.user.get_full_name() or r.user.email,
            'participant_email': r.user.email,
            'event_title': r.event.title,
            'event_id': r.event.id,
            'ticket_type': r.ticket_type.get_type_name_display(),
            'quantity': r.quantity,
            'total_price': float(r.total_price),
            'payment_status': r.get_payment_status_display(),
            'created_at': r.created_at.isoformat(),
        } for r in recent_reservations_qs]
        
        six_months_ago = timezone.now() - timezone.timedelta(days=180)
        
        revenue_by_month_qs = Reservation.objects.filter(
            is_cancelled=False,
            payment_status='paid',
            created_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            total=Sum('total_price')
        ).order_by('month')
        
        revenue_by_month = [{
            'month': item['month'].strftime('%Y-%m'),
            'total': float(item['total']),
        } for item in revenue_by_month_qs]
        
        reservations_by_month_qs = Reservation.objects.filter(
            is_cancelled=False,
            created_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        reservations_by_month = [{
            'month': item['month'].strftime('%Y-%m'),
            'count': item['count'],
        } for item in reservations_by_month_qs]
        
        top_organizers_qs = User.objects.filter(role='organizer').annotate(
            event_count=Count('organized_events'),
            tickets_sold=Sum('organized_events__reservations__quantity',
                filter=Q(organized_events__reservations__is_cancelled=False)),
            revenue=Sum('organized_events__reservations__total_price',
                filter=Q(
                    organized_events__reservations__is_cancelled=False,
                    organized_events__reservations__payment_status='paid'
                )),
        ).order_by('-revenue')[:5]
        
        top_organizers = [{
            'id': o.id,
            'email': o.email,
            'first_name': o.first_name,
            'last_name': o.last_name,
            'event_count': o.event_count or 0,
            'tickets_sold': o.tickets_sold or 0,
            'revenue': float(o.revenue or 0),
        } for o in top_organizers_qs]
        
        stats = {
            'total_users': total_users,
            'total_events': total_events,
            'total_reservations': total_reservations,
            'total_revenue': float(total_revenue),
            'events_by_status': events_by_status,
            'events_by_category': events_by_category,
            'users_by_role': users_by_role,
            'recent_users': recent_users,
            'recent_reservations': recent_reservations,
            'revenue_by_month': revenue_by_month,
            'reservations_by_month': reservations_by_month,
            'top_organizers': top_organizers,
        }
        
        return Response(stats)
