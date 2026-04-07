from django.contrib.auth.views import LogoutView
from django.urls import path, re_path
from django.views.static import serve
from HTI import settings
from VIPAlert.views import HomeView, LoginView, UsersListView, AddUserView, EditUserView


app_name = "VIP"
urlpatterns = [
    path('', HomeView.as_view(), name="home"),
    path('login', LoginView.as_view(), name="login"),
    path('logout', LogoutView.as_view(), name='logout'),
    path('users', UsersListView.as_view(), name="users_list"),

    path('add_user', AddUserView.as_view(), name="add_user"),
    path('edit_user/<int:pk>', EditUserView.as_view(), name="edit_user"),
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
]
