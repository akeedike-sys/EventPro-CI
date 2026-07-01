from django.contrib import admin
from .models import Event

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'organizer', 'date_start', 'location', 'max_capacity', 'status', 'created_at')
    list_filter = ('status', 'category', 'date_start', 'created_at')
    search_fields = ('title', 'description', 'location', 'organizer__email')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('title', 'description', 'organizer', 'category', 'status')
        }),
        ('Détails de l\'événement', {
            'fields': ('date_start', 'date_end', 'location', 'max_capacity', 'image')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing an existing object
            return self.readonly_fields + ('organizer',)
        return self.readonly_fields
