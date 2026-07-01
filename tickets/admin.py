from django.contrib import admin
from .models import TicketType, Reservation

@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
    list_display = ('event', 'type_name', 'price', 'quota', 'sold', 'created_at')
    list_filter = ('type_name', 'event', 'created_at')
    search_fields = ('event__title', 'type_name')
    readonly_fields = ('sold', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Informations', {
            'fields': ('event', 'type_name', 'price', 'quota', 'sold')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('ticket_code', 'user', 'event', 'ticket_type', 'quantity', 'total_price', 'status', 'payment_status', 'created_at')
    list_filter = ('status', 'payment_status', 'ticket_type__type_name', 'created_at', 'is_cancelled')
    search_fields = ('ticket_code', 'user__email', 'event__title')
    readonly_fields = ('ticket_code', 'created_at', 'updated_at', 'id')
    
    fieldsets = (
        ('Informations de réservation', {
            'fields': ('id', 'ticket_code', 'user', 'event', 'ticket_type', 'quantity')
        }),
        ('Paiement', {
            'fields': ('total_price', 'status', 'payment_status', 'is_cancelled')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing an existing object
            return self.readonly_fields + ('user', 'event', 'ticket_type', 'quantity')
        return self.readonly_fields
