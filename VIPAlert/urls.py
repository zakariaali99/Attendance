from django.contrib.auth.views import LogoutView
from django.urls import path, re_path
from django.contrib.staticfiles.views import serve as staticfiles_serve
from VIPAlert.views import (
    HomeView, LoginView, UsersListView, AddUserView, EditUserView, 
    DeleteUserView, SystemLogListView, UserTraceView
)


app_name = "VIP"
urlpatterns = [
    path('', HomeView.as_view(), name="home"),
    path('login', LoginView.as_view(), name="login"),
    path('logout', LogoutView.as_view(), name='logout'),
    path('users', UsersListView.as_view(), name="users_list"),
    path('add_user', AddUserView.as_view(), name="add_user"),
    path('edit_user/<int:pk>', EditUserView.as_view(), name="edit_user"),
    path('delete_user/<int:pk>', DeleteUserView.as_view(), name="delete_user"),
    path('logs', SystemLogListView.as_view(), name="system_logs"),
    path('trace_user/<int:pk>', UserTraceView.as_view(), name="trace_user"),
    re_path(r'^static/(?P<path>.*)$', staticfiles_serve, {'insecure': True}),
]
