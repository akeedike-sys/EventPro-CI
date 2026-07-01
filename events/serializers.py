from rest_framework import serializers
from .models import Event
from users.serializers import UserSerializer

class EventListSerializer(serializers.ModelSerializer):
    organizer_name = serializers.CharField(source='organizer.get_full_name', read_only=True)
    available_seats = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    min_price = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Event
        fields = ['id', 'title', 'date_start', 'date_end', 'location', 'max_capacity', 
                  'available_seats', 'status', 'status_display', 'organizer', 'organizer_name', 
                  'category', 'image', 'created_at', 'min_price']
        read_only_fields = ['id', 'created_at', 'available_seats', 'min_price']

class EventDetailSerializer(serializers.ModelSerializer):
    organizer = UserSerializer(read_only=True)
    available_seats = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'date_start', 'date_end', 'location', 
                  'max_capacity', 'available_seats', 'status', 'status_display', 'organizer',
                  'image', 'category', 'category_display', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'available_seats']

class EventCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['title', 'description', 'date_start', 'date_end', 'location', 
                  'max_capacity', 'status', 'image', 'category']
