import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventpro_ci.settings')
django.setup()

from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from events.models import Event
from tickets.models import TicketType, Reservation
from notifications.models import Notification

User = get_user_model()
now = timezone.now()

admin = User.objects.get(email='admin@eventpro.ci')
organizer = User.objects.get(email='organizer@eventpro.ci')
participant = User.objects.get(email='participant@eventpro.ci')

print("Création des données de test...")

# ============================================================
# 1. ÉVÉNEMENT PASSÉ — Conférence Tech 2025
# ============================================================
past_event, _ = Event.objects.get_or_create(
    title='Conférence Tech 2025',
    defaults=dict(
        description='Une grande conférence sur les technologies modernes : IA, Cloud, Cybersécurité et DevOps.',
        organizer=organizer,
        date_start=now - timedelta(days=30),
        date_end=now - timedelta(days=29, hours=8),
        location='Espace Congrès, Abidjan',
        max_capacity=200,
        status='published',
        category='professional',
    ),
)
std_past, _ = TicketType.objects.get_or_create(
    event=past_event, type_name='standard',
    defaults=dict(price=15000, quota=150, sold=120),
)
vip_past, _ = TicketType.objects.get_or_create(
    event=past_event, type_name='vip',
    defaults=dict(price=50000, quota=30, sold=25),
)
std_past_2, _ = TicketType.objects.get_or_create(
    event=past_event, type_name='student',
    defaults=dict(price=5000, quota=20, sold=18),
)

# Réservation confirmée + payée
Reservation.objects.get_or_create(
    ticket_code=f'{past_event.id}-PASTCONF',
    defaults=dict(
        user=participant,
        event=past_event,
        ticket_type=std_past,
        quantity=2,
        status='confirmed',
        is_cancelled=False,
        payment_status='paid',
        total_price=30000,
    ),
)

# Réservation annulée + remboursée
Reservation.objects.get_or_create(
    ticket_code=f'{past_event.id}-PASTCANCEL',
    defaults=dict(
        user=participant,
        event=past_event,
        ticket_type=vip_past,
        quantity=1,
        status='cancelled',
        is_cancelled=True,
        payment_status='refunded',
        total_price=50000,
    ),
)

print(f'  [OK] Événement passé : {past_event.title}')

# ============================================================
# 2. ÉVÉNEMENT FUTUR — Festival de Musique Urbaine
# ============================================================
future_event, _ = Event.objects.get_or_create(
    title='Festival de Musique Urbaine',
    defaults=dict(
        description='Un festival regroupant les meilleurs artistes de la scène urbaine avec 3 scènes et 20 artistes.',
        organizer=organizer,
        date_start=now + timedelta(days=15),
        date_end=now + timedelta(days=16),
        location='Parc des Expositions, Abidjan',
        max_capacity=500,
        status='published',
        category='cultural',
    ),
)
std_fut, _ = TicketType.objects.get_or_create(
    event=future_event, type_name='standard',
    defaults=dict(price=10000, quota=300, sold=45),
)
vip_fut, _ = TicketType.objects.get_or_create(
    event=future_event, type_name='vip',
    defaults=dict(price=25000, quota=100, sold=20),
)
std_fut_2, _ = TicketType.objects.get_or_create(
    event=future_event, type_name='student',
    defaults=dict(price=5000, quota=100, sold=12),
)

# Réservation en attente (pending)
Reservation.objects.get_or_create(
    ticket_code=f'{future_event.id}-FUTPEND',
    defaults=dict(
        user=participant,
        event=future_event,
        ticket_type=std_fut,
        quantity=3,
        status='pending',
        is_cancelled=False,
        payment_status='pending',
        total_price=30000,
    ),
)

print(f'  [OK] Événement futur : {future_event.title}')

# ============================================================
# 3. BROUILLON — Séminaire Marketing Digital
# ============================================================
draft_event, _ = Event.objects.get_or_create(
    title='Séminaire Marketing Digital',
    defaults=dict(
        description='Apprenez les stratégies de marketing digital les plus efficaces : SEO, SEA, Social Media.',
        organizer=organizer,
        date_start=now + timedelta(days=45),
        date_end=now + timedelta(days=45, hours=5),
        location='Novotel, Plateau',
        max_capacity=100,
        status='draft',
        category='professional',
    ),
)
TicketType.objects.get_or_create(
    event=draft_event, type_name='standard',
    defaults=dict(price=25000, quota=80, sold=0),
)
TicketType.objects.get_or_create(
    event=draft_event, type_name='vip',
    defaults=dict(price=60000, quota=20, sold=0),
)

print(f'  [OK] Brouillon : {draft_event.title}')

# ============================================================
# 4. ÉVÉNEMENT ANNULÉ — Course de Karting
# ============================================================
cancelled_event, _ = Event.objects.get_or_create(
    title='Course de Karting',
    defaults=dict(
        description='Compétition annulée pour raisons logistiques.',
        organizer=organizer,
        date_start=now - timedelta(days=5),
        date_end=now - timedelta(days=4, hours=6),
        location='Circuit Karting, Port Bouët',
        max_capacity=50,
        status='cancelled',
        category='sports',
    ),
)
TicketType.objects.get_or_create(
    event=cancelled_event, type_name='standard',
    defaults=dict(price=20000, quota=40, sold=5),
)

print(f'  [OK] Événement annulé : {cancelled_event.title}')

# ============================================================
# 5. ÉVÉNEMENT FUTUR — Concert de Gospel "Louange & Adoration"
# ============================================================
gospel_event, _ = Event.objects.get_or_create(
    title='Concert de Gospel "Louange & Adoration"',
    defaults=dict(
        description='Une soirée de louange et d\'adoration avec 10 chorales gospel venues de toute la Côte d\'Ivoire.',
        organizer=organizer,
        date_start=now + timedelta(days=20),
        date_end=now + timedelta(days=20, hours=5),
        location='Palais de la Culture, Treichville',
        max_capacity=800,
        status='published',
        category='cultural',
    ),
)
std_gospel, _ = TicketType.objects.get_or_create(
    event=gospel_event, type_name='standard',
    defaults=dict(price=5000, quota=500, sold=180),
)
vip_gospel, _ = TicketType.objects.get_or_create(
    event=gospel_event, type_name='vip',
    defaults=dict(price=15000, quota=200, sold=45),
)
std_gospel_2, _ = TicketType.objects.get_or_create(
    event=gospel_event, type_name='student',
    defaults=dict(price=2500, quota=100, sold=30),
)

Reservation.objects.get_or_create(
    ticket_code=f'{gospel_event.id}-GOSPELCONF',
    defaults=dict(
        user=participant,
        event=gospel_event,
        ticket_type=std_gospel,
        quantity=4,
        status='confirmed',
        is_cancelled=False,
        payment_status='paid',
        total_price=20000,
    ),
)

print(f'  [OK] Événement futur : {gospel_event.title}')

# ============================================================
# 6. ÉVÉNEMENT FUTUR — Marathon International d'Abidjan
# ============================================================
marathon_event, _ = Event.objects.get_or_create(
    title='Marathon International d\'Abidjan',
    defaults=dict(
        description='Le plus grand rassemblement de coureurs d\'Afrique de l\'Ouest. Parcours de 42 km à travers les rues d\'Abidjan.',
        organizer=organizer,
        date_start=now + timedelta(days=40),
        date_end=now + timedelta(days=40, hours=8),
        location='Place de la République, Plateau',
        max_capacity=2000,
        status='published',
        category='sports',
    ),
)
std_marathon, _ = TicketType.objects.get_or_create(
    event=marathon_event, type_name='standard',
    defaults=dict(price=10000, quota=1500, sold=320),
)
vip_marathon, _ = TicketType.objects.get_or_create(
    event=marathon_event, type_name='vip',
    defaults=dict(price=30000, quota=500, sold=85),
)

Reservation.objects.get_or_create(
    ticket_code=f'{marathon_event.id}-MARAPEND',
    defaults=dict(
        user=participant,
        event=marathon_event,
        ticket_type=std_marathon,
        quantity=1,
        status='pending',
        is_cancelled=False,
        payment_status='pending',
        total_price=10000,
    ),
)

print(f'  [OK] Événement futur : {marathon_event.title}')

# ============================================================
# 7. ÉVÉNEMENT FUTUR (PRESQUE COMPLET) — Salon de l'Emploi
# ============================================================
emploi_event, _ = Event.objects.get_or_create(
    title='Salon de l\'Emploi & Carrières',
    defaults=dict(
        description='Le plus grand salon de recrutement en Côte d\'Ivoire. 50 entreprises, des conférences et du networking.',
        organizer=organizer,
        date_start=now + timedelta(days=10),
        date_end=now + timedelta(days=10, hours=8),
        location='Centre de Conférences, Sofitel Abidjan',
        max_capacity=300,
        status='published',
        category='professional',
    ),
)
std_emploi, _ = TicketType.objects.get_or_create(
    event=emploi_event, type_name='standard',
    defaults=dict(price=15000, quota=200, sold=190),
)
vip_emploi, _ = TicketType.objects.get_or_create(
    event=emploi_event, type_name='vip',
    defaults=dict(price=50000, quota=100, sold=98),
)

Reservation.objects.get_or_create(
    ticket_code=f'{emploi_event.id}-EMPLOICONF',
    defaults=dict(
        user=participant,
        event=emploi_event,
        ticket_type=std_emploi,
        quantity=2,
        status='confirmed',
        is_cancelled=False,
        payment_status='paid',
        total_price=30000,
    ),
)

print(f'  [OK] Événement futur (presque complet) : {emploi_event.title}')

# ============================================================
# 8. ÉVÉNEMENT PASSÉ — Soirée Théâtre "Les Fleurs du Mal"
# ============================================================
theatre_event, _ = Event.objects.get_or_create(
    title='Soirée Théâtre "Les Fleurs du Mal"',
    defaults=dict(
        description='Adaptation théâtrale du célèbre recueil de poèmes de Charles Baudelaire par la troupe du Théâtre National.',
        organizer=organizer,
        date_start=now - timedelta(days=15),
        date_end=now - timedelta(days=15, hours=3),
        location='Théâtre Municipal, Cocody',
        max_capacity=150,
        status='published',
        category='cultural',
    ),
)
std_theatre, _ = TicketType.objects.get_or_create(
    event=theatre_event, type_name='standard',
    defaults=dict(price=10000, quota=100, sold=90),
)
vip_theatre, _ = TicketType.objects.get_or_create(
    event=theatre_event, type_name='vip',
    defaults=dict(price=25000, quota=50, sold=48),
)

Reservation.objects.get_or_create(
    ticket_code=f'{theatre_event.id}-THEATCAN',
    defaults=dict(
        user=participant,
        event=theatre_event,
        ticket_type=vip_theatre,
        quantity=2,
        status='cancelled',
        is_cancelled=True,
        payment_status='refunded',
        total_price=50000,
    ),
)

print(f'  [OK] Événement passé : {theatre_event.title}')

# ============================================================
# 9. ÉVÉNEMENT FUTUR — Atelier Intensif de Danse Afro
# ============================================================
danse_event, _ = Event.objects.get_or_create(
    title='Atelier Intensif de Danse Afro',
    defaults=dict(
        description='Un week-end immersion dans les danses traditionnelles et modernes africaines avec des chorégraphes internationaux.',
        organizer=organizer,
        date_start=now + timedelta(days=25),
        date_end=now + timedelta(days=26, hours=8),
        location='Institut Français, Plateau',
        max_capacity=100,
        status='published',
        category='cultural',
    ),
)
std_danse, _ = TicketType.objects.get_or_create(
    event=danse_event, type_name='standard',
    defaults=dict(price=2000, quota=80, sold=15),
)
vip_danse, _ = TicketType.objects.get_or_create(
    event=danse_event, type_name='vip',
    defaults=dict(price=5000, quota=20, sold=3),
)

print(f'  [OK] Événement futur : {danse_event.title}')

# ============================================================
# 10. ÉVÉNEMENT TERMINÉ — Hackathon IA & Data 2025
# ============================================================
hackathon_event, _ = Event.objects.get_or_create(
    title='Hackathon IA & Data 2025',
    defaults=dict(
        description='48 heures pour créer des solutions innovantes basées sur l\'intelligence artificielle et la data science.',
        organizer=organizer,
        date_start=now - timedelta(days=60),
        date_end=now - timedelta(days=58),
        location='Orange Tech Hub, Marcory',
        max_capacity=120,
        status='completed',
        category='professional',
    ),
)
std_hack, _ = TicketType.objects.get_or_create(
    event=hackathon_event, type_name='standard',
    defaults=dict(price=10000, quota=100, sold=100),
)
vip_hack, _ = TicketType.objects.get_or_create(
    event=hackathon_event, type_name='vip',
    defaults=dict(price=25000, quota=20, sold=20),
)

Reservation.objects.get_or_create(
    ticket_code=f'{hackathon_event.id}-HACKCONF',
    defaults=dict(
        user=participant,
        event=hackathon_event,
        ticket_type=std_hack,
        quantity=1,
        status='confirmed',
        is_cancelled=False,
        payment_status='paid',
        total_price=10000,
    ),
)

print(f'  [OK] Événement terminé : {hackathon_event.title}')

# ============================================================
# 11. BROUILLON — Tournoi de Basketball 3x3
# ============================================================
basket_event, _ = Event.objects.get_or_create(
    title='Tournoi de Basketball 3x3',
    defaults=dict(
        description='Tournoi de basketball 3 contre 3 avec des équipes venues de tout le district d\'Abidjan.',
        organizer=organizer,
        date_start=now + timedelta(days=50),
        date_end=now + timedelta(days=50, hours=6),
        location='Gymnase du CHU, Treichville',
        max_capacity=200,
        status='draft',
        category='sports',
    ),
)
std_basket, _ = TicketType.objects.get_or_create(
    event=basket_event, type_name='standard',
    defaults=dict(price=3000, quota=150, sold=0),
)
vip_basket, _ = TicketType.objects.get_or_create(
    event=basket_event, type_name='vip',
    defaults=dict(price=8000, quota=50, sold=0),
)

print(f'  [OK] Brouillon : {basket_event.title}')

# ============================================================
# 12. ÉVÉNEMENT EN COURS — Exposition d'Art Moderne
# ============================================================
expo_event, _ = Event.objects.get_or_create(
    title='Exposition d\'Art Moderne Africain',
    defaults=dict(
        description='Découvrez les œuvres de 30 artistes contemporains africains. Peintures, sculptures et installations interactives.',
        organizer=organizer,
        date_start=now - timedelta(days=1),
        date_end=now + timedelta(days=1),
        location='Galerie d\'Art, Cocody Angré',
        max_capacity=300,
        status='published',
        category='cultural',
    ),
)
std_expo, _ = TicketType.objects.get_or_create(
    event=expo_event, type_name='standard',
    defaults=dict(price=5000, quota=200, sold=120),
)
vip_expo, _ = TicketType.objects.get_or_create(
    event=expo_event, type_name='vip',
    defaults=dict(price=12000, quota=100, sold=40),
)

Reservation.objects.get_or_create(
    ticket_code=f'{expo_event.id}-EXPOCONF',
    defaults=dict(
        user=participant,
        event=expo_event,
        ticket_type=std_expo,
        quantity=2,
        status='confirmed',
        is_cancelled=False,
        payment_status='paid',
        total_price=10000,
    ),
)

print(f'  [OK] Événement en cours : {expo_event.title}')

# ============================================================
# NOTIFICATIONS
# ============================================================

notifications_data = [
    dict(
        user=participant, event=future_event,
        notification_type='reservation_confirmed',
        title='Réservation confirmée',
        message='Votre réservation pour le Festival de Musique Urbaine a été confirmée. 3 billets Standard vous attendent.',
        is_read=False,
    ),
    dict(
        user=organizer, event=future_event,
        notification_type='event_published',
        title='Événement publié',
        message='Votre événement "Festival de Musique Urbaine" a été publié avec succès.',
        is_read=False,
    ),
    dict(
        user=organizer, event=cancelled_event,
        notification_type='event_cancelled',
        title='Événement annulé',
        message='Votre événement "Course de Karting" a été annulé.',
        is_read=False,
    ),
    dict(
        user=participant, event=past_event,
        notification_type='reservation_confirmed',
        title='Réservation confirmée',
        message='Votre réservation pour la Conférence Tech 2025 (2 billets Standard) a été confirmée.',
        is_read=True,
    ),
    dict(
        user=participant, event=past_event,
        notification_type='reservation_cancelled',
        title='Réservation annulée',
        message='Votre réservation VIP pour la Conférence Tech 2025 a été annulée et remboursée.',
        is_read=False,
    ),
    # Notifications pour Concert Gospel
    dict(
        user=participant, event=gospel_event,
        notification_type='reservation_confirmed',
        title='Réservation confirmée',
        message='Votre réservation pour le Concert de Gospel (4 billets Standard) a été confirmée.',
        is_read=False,
    ),
    dict(
        user=organizer, event=gospel_event,
        notification_type='event_published',
        title='Événement publié',
        message='Votre événement "Concert de Gospel" a été publié avec succès.',
        is_read=False,
    ),
    # Notifications pour Marathon
    dict(
        user=participant, event=marathon_event,
        notification_type='reservation_confirmed',
        title='Réservation en attente',
        message='Votre inscription au Marathon International d\'Abidjan est en attente de paiement.',
        is_read=False,
    ),
    dict(
        user=organizer, event=marathon_event,
        notification_type='event_published',
        title='Marathon publié',
        message='Votre événement "Marathon International d\'Abidjan" a été publié.',
        is_read=False,
    ),
    # Notifications pour Salon Emploi
    dict(
        user=participant, event=emploi_event,
        notification_type='reservation_confirmed',
        title='Réservation confirmée',
        message='Votre réservation pour le Salon de l\'Emploi (2 billets Standard) a été confirmée.',
        is_read=False,
    ),
    dict(
        user=organizer, event=emploi_event,
        notification_type='seats_updated',
        title='Plages presque complètes',
        message='Votre événement "Salon de l\'Emploi" est presque complet. Il ne reste que 12 places.',
        is_read=False,
    ),
    # Notifications pour Soirée Théâtre
    dict(
        user=participant, event=theatre_event,
        notification_type='reservation_cancelled',
        title='Réservation annulée',
        message='Votre réservation VIP pour la Soirée Théâtre a été annulée et remboursée.',
        is_read=False,
    ),
    # Notifications pour Hackathon
    dict(
        user=participant, event=hackathon_event,
        notification_type='reservation_confirmed',
        title='Réservation confirmée',
        message='Votre participation au Hackathon IA & Data 2025 a été confirmée.',
        is_read=True,
    ),
    dict(
        user=organizer, event=hackathon_event,
        notification_type='event_published',
        title='Hackathon terminé',
        message='Votre événement "Hackathon IA & Data 2025" est terminé. Merci pour votre organisation !',
        is_read=True,
    ),
    # Notifications pour Exposition d'Art
    dict(
        user=participant, event=expo_event,
        notification_type='reservation_confirmed',
        title='Réservation confirmée',
        message='Votre réservation pour l\'Exposition d\'Art Moderne (2 billets Standard) a été confirmée.',
        is_read=False,
    ),
    dict(
        user=organizer, event=expo_event,
        notification_type='event_published',
        title='Exposition publiée',
        message='Votre événement "Exposition d\'Art Moderne Africain" est en cours.',
        is_read=False,
    ),
]

for notif_data in notifications_data:
    Notification.objects.get_or_create(
        user=notif_data['user'],
        title=notif_data['title'],
        message=notif_data['message'],
        defaults=notif_data,
    )

print(f'  [OK] {len(notifications_data)} notifications créées')

print()
print('=== Résumé ===')
print(f'  Événements : {Event.objects.count()}')
print(f'  Types de billets : {TicketType.objects.count()}')
print(f'  Réservations : {Reservation.objects.count()}')
print(f'  Notifications : {Notification.objects.count()}')
print()
print('Seed data terminé avec succès !')
