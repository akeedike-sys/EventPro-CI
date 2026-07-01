import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class EventConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Appelé quand un client WebSocket se connecte"""
        self.event_id = self.scope['url_route']['kwargs']['event_id']
        self.event_group_name = f'event_{self.event_id}'
        self.user = self.scope['user']
        
        # Rejoindre le groupe d'événement
        await self.channel_layer.group_add(
            self.event_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Envoyer un message de bienvenue
        await self.send(json.dumps({
            'type': 'connection',
            'message': f'Connecté à l\'événement {self.event_id}',
            'user_id': self.user.id if self.user.is_authenticated else None,
        }))
    
    async def disconnect(self, close_code):
        """Appelé quand un client WebSocket se déconnecte"""
        await self.channel_layer.group_discard(
            self.event_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Appelé quand un message est reçu du client"""
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'ping':
            await self.send(json.dumps({
                'type': 'pong',
                'message': 'pong',
            }))
    
    # Handlers pour les messages du groupe
    async def event_update(self, event):
        """Envoyer une mise à jour d'événement"""
        await self.send(json.dumps({
            'type': 'event_update',
            'data': event['message'],
        }))
    
    async def reservation_update(self, event):
        """Envoyer une mise à jour de réservation"""
        await self.send(json.dumps({
            'type': 'reservation_update',
            'data': event['message'],
        }))

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Connexion aux notifications personnelles"""
        self.user = self.scope['user']
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        self.notification_group_name = f'user_notifications_{self.user.id}'
        
        # Rejoindre le groupe de notifications
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Envoyer les notifications non lues
        unread_notifications = await self.get_unread_notifications()
        await self.send(json.dumps({
            'type': 'unread_count',
            'count': len(unread_notifications),
        }))
    
    async def disconnect(self, close_code):
        """Déconnexion"""
        await self.channel_layer.group_discard(
            self.notification_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Recevoir les messages du client"""
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'mark_as_read':
            notification_id = data.get('notification_id')
            await self.mark_notification_as_read(notification_id)
    
    async def send_notification(self, event):
        """Envoyer une notification"""
        await self.send(json.dumps({
            'type': 'notification',
            'data': event['message'],
        }))
    
    async def unread_count(self, event):
        """Envoyer le nombre de non lues"""
        await self.send(json.dumps({
            'type': 'unread_count',
            'count': event['count'],
        }))
    
    @database_sync_to_async
    def get_unread_notifications(self):
        """Récupérer les notifications non lues"""
        from .models import Notification
        return list(Notification.objects.filter(
            user=self.user,
            is_read=False
        ).values())
    
    @database_sync_to_async
    def mark_notification_as_read(self, notification_id):
        """Marquer une notification comme lue"""
        from .models import Notification
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=self.user
            )
            notification.is_read = True
            notification.save()
        except Notification.DoesNotExist:
            pass
