from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from rest_framework.routers import DefaultRouter, APIRootView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenRefreshView


class PublicAPIRootView(APIRootView):
    permission_classes = [AllowAny]


class PublicAPIRouter(DefaultRouter):
    APIRootView = PublicAPIRootView

from users.views import UserViewSet, CustomTokenObtainPairView
from events.views import EventViewSet
from tickets.views import TicketTypeViewSet, ReservationViewSet
from dashboard.views import DashboardViewSet
from notifications.views import NotificationViewSet

router = PublicAPIRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'events', EventViewSet, basename='event')
router.register(r'ticket-types', TicketTypeViewSet, basename='ticket-type')
router.register(r'reservations', ReservationViewSet, basename='reservation')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(router.urls)),
    path('api/v1/auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
