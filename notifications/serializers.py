from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True, allow_null=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'notification_type_display', 'title', 'message', 
                  'event', 'event_title', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
