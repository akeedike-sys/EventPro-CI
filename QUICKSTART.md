# 🚀 Démarrage Rapide - EVENTPRO CI

Ce guide est optimisé pour Windows avec PowerShell.

## ⚡ Démarrage en 5 minutes

### 1. Cloner le projet
```powershell
git clone https://github.com/yourusername/eventpro-ci.git
cd eventpro-ci
```

### 2. Créer l'environnement virtuel
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Installer les dépendances
```powershell
pip install -r requirements.txt
```

### 4. Configurer les variables d'environnement
```powershell
Copy-Item .env.example .env
# Éditer .env si nécessaire (optionnel pour le dev)
```

### 5. Initialiser la base de données
```powershell
python manage.py migrate
```

### 6. Créer un super utilisateur (admin)
```powershell
python manage.py createsuperuser
# Email: admin@example.com
# Password: Admin123!
```

### 7. Démarrer Redis (optionnel mais recommandé pour WebSocket)
```powershell
# Option 1: Avec Docker
docker run -d -p 6379:6379 redis:latest

# Option 2: Avec WSL
wsl redis-server
```

### 8. Démarrer le serveur Django
```powershell
# Avec WebSocket (ASGI - recommandé)
daphne -b 0.0.0.0 -p 8000 eventpro_ci.asgi:application

# Ou sans WebSocket (WSGI)
python manage.py runserver
```

✅ Le serveur est maintenant accessible à **http://localhost:8000**

## 📝 Commandes essentielles

```powershell
# Créer un nouvel utilisateur
python manage.py shell
>>> from users.models import User
>>> User.objects.create_user(
...     email='organizer@example.com',
...     password='Password123!',
...     role='organizer'
... )

# Accéder à l'admin
# http://localhost:8000/admin (credentials: admin/Admin123!)

# Appliquer les migrations
python manage.py migrate

# Créer les migrations
python manage.py makemigrations

# Voir les routes
python manage.py show_urls
```

## 🔐 Authentification via API

### 1. Inscription
```powershell
$body = @{
    email = "organizer@example.com"
    first_name = "Marie"
    last_name = "Martin"
    password = "Password123!"
    password_confirm = "Password123!"
    role = "organizer"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/users/" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response.Content | ConvertFrom-Json
```

### 2. Connexion et obtenir le token
```powershell
$auth = @{
    email = "organizer@example.com"
    password = "Password123!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/auth/token/" `
    -Method POST `
    -ContentType "application/json" `
    -Body $auth

$token = ($response.Content | ConvertFrom-Json).access
Write-Host "Token: $token"
```

### 3. Utiliser le token
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Créer un événement
$eventData = @{
    title = "Conférence Tech"
    description = "Une conférence sur la tech"
    date_start = "2024-12-20T10:00:00Z"
    date_end = "2024-12-20T18:00:00Z"
    location = "Abidjan, Plateau"
    max_capacity = 500
    status = "draft"
    category = "professional"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/events/" `
    -Method POST `
    -Headers $headers `
    -Body $eventData

$response.Content | ConvertFrom-Json
```

## 🌐 Tester les WebSocket

### Utiliser une CLI WebSocket
```powershell
# Installer wscat
npm install -g wscat

# Se connecter à un événement (remplacer 1 par l'event_id)
wscat -c ws://localhost:8000/ws/event/1/

# Attendre les messages en temps réel
```

### Avec JavaScript dans le navigateur
```javascript
// Dans la console du navigateur
const ws = new WebSocket('ws://localhost:8000/ws/event/1/');

ws.onopen = () => console.log('Connecté');
ws.onmessage = (e) => console.log('Message:', JSON.parse(e.data));
ws.onerror = (e) => console.error('Erreur:', e);
ws.onclose = () => console.log('Déconnecté');

// Envoyer un ping
ws.send(JSON.stringify({type: 'ping'}));
```

## 📊 Importer la collection Postman

1. Ouvrir **Postman**
2. Cliquer sur **Import**
3. Sélectionner `postman_collection.json`
4. Définir les variables d'environnement :
   - `base_url` = `http://localhost:8000`
   - `access_token` = votre token JWT
   - `event_id` = ID de l'événement

5. Tester les endpoints

## 🐛 Dépannage

### Port 8000 déjà utilisé
```powershell
# Trouver le processus
Get-NetTCPConnection -LocalPort 8000

# Tuer le processus (remplacer XXXX par le PID)
Stop-Process -Id XXXX -Force

# Ou utiliser un autre port
python manage.py runserver 8001
```

### Redis non disponible
```powershell
# Vérifier si Redis est en cours d'exécution
Test-NetConnection -ComputerName localhost -Port 6379

# Démarrer avec Docker
docker run -d -p 6379:6379 redis:latest
```

### Erreurs de migration
```powershell
# Réinitialiser les migrations
python manage.py migrate events zero
python manage.py migrate

# Ou supprimer la DB et recommencer
Remove-Item db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### Variables d'environnement non chargées
```powershell
# Ajouter manuellement au script
$env:SECRET_KEY = "your-secret-key"
$env:DEBUG = "True"
$env:ALLOWED_HOSTS = "localhost,127.0.0.1"

# Puis exécuter Django
python manage.py runserver
```

## 📱 Structure API

```
BASE_URL = http://localhost:8000/api/v1

POST   /users/                         # Inscription
GET    /users/profile/                 # Mon profil
POST   /auth/token/                    # Connexion (obtenir token)
POST   /auth/token/refresh/            # Rafraîchir le token

GET    /events/                        # Lister les événements
POST   /events/                        # Créer un événement
GET    /events/{id}/                   # Détails d'un événement
POST   /events/{id}/publish/           # Publier
POST   /events/{id}/cancel/            # Annuler

POST   /ticket-types/                  # Créer un type de billet
GET    /ticket-types/                  # Lister les types

POST   /reservations/                  # Réserver
GET    /reservations/my_reservations/  # Mes réservations
POST   /reservations/{id}/cancel/      # Annuler une réservation

GET    /dashboard/organizer_stats/     # Statistiques
GET    /dashboard/event_details/       # Détails par événement
```

## 🎯 Flux de travail courant

### Pour un Organisateur

1. S'inscrire avec `role="organizer"`
2. Se connecter et récupérer le token
3. Créer un événement
4. Créer des types de billets
5. Publier l'événement
6. Voir les statistiques et participants

### Pour un Participant

1. S'inscrire avec `role="participant"`
2. Se connecter
3. Consulter les événements disponibles
4. Réserver un billet
5. Recevoir les notifications en temps réel

## 📚 Documentation complète

Voir `README.md` pour la documentation complète du projet.

## ✨ Tips & Astuces

```powershell
# Voir tous les utilisateurs
python manage.py shell
>>> from users.models import User
>>> list(User.objects.all())

# Voir tous les événements
>>> from events.models import Event
>>> list(Event.objects.all())

# Changer le rôle d'un utilisateur
>>> user = User.objects.get(email='organizer@example.com')
>>> user.role = 'participant'
>>> user.save()

# Supprimer tous les événements
>>> Event.objects.all().delete()

# Voir les requêtes SQL
>>> from django.db import connection
>>> connection.queries
```

## 🚀 Production

### Déployer sur un serveur

1. Changer `DEBUG = False` dans `.env`
2. Générer une nouvelle `SECRET_KEY`
3. Configurer une base PostgreSQL
4. Utiliser un serveur ASGI comme `uvicorn` ou `gunicorn` + `daphne`
5. Configurer un reverse proxy (Nginx)
6. Configurer Redis en remote
7. Utiliser HTTPS

```bash
# Exemple avec gunicorn + daphne
pip install gunicorn
gunicorn eventpro_ci.wsgi:application
```

---

**Questions?** Consultez le `README.md` ou ouvrez une issue sur GitHub!

**Bonne chance avec EVENTPRO CI! 🎉**
