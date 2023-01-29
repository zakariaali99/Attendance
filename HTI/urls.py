
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from . import settings

urlpatterns = [
   
    path('accounts/', include("VIPAlert.urls")),
    path('', include("Attendance.urls")),
    
    # path('', include("Home.urls")),
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
    # re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}, name="media"),
]
