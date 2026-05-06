
from django.contrib import admin
from django.urls import path, include, re_path
from django.contrib.staticfiles.views import serve as staticfiles_serve
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.conf.urls.static import static


def health_check(request):
    """Simple health check endpoint for production monitoring."""
    return JsonResponse({
        "status": "healthy",
        "service": "Al-Khwarizmi Attendance System",
        "version": "1.0.0"
    })


urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('accounts/', include("VIPAlert.urls")),
    path('', include("Attendance.urls")),
    
    # API - uncomment to enable REST API
    # path('api/', include("Attendance.api_urls")),
    
    # path('', include("Home.urls")),
    re_path(r'^static/(?P<path>.*)$', staticfiles_serve, {'insecure': True}),
    # re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}, name="media"),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler403 = 'Attendance.views.permission_denied_view'
