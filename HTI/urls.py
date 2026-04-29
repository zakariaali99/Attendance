
from django.contrib import admin
from django.urls import path, include, re_path
from django.contrib.staticfiles.views import serve as staticfiles_serve

urlpatterns = [
   
    path('accounts/', include("VIPAlert.urls")),
    path('', include("Attendance.urls")),
    
    # path('', include("Home.urls")),
    re_path(r'^static/(?P<path>.*)$', staticfiles_serve, {'insecure': True}),
    # re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}, name="media"),
]
