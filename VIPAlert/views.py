from django.contrib.auth import login
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.contrib.auth.models import User
from django.core.paginator import Paginator
from django.db.models import Q
from django.http import HttpRequest
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.views.generic import TemplateView, ListView, UpdateView, CreateView, FormView, RedirectView, DeleteView
from django.utils.translation import gettext_lazy as _
from VIPAlert.forms import *
from VIPAlert.models import *


class HomeView(TemplateView):
    template_name = "home.html"

    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect("VIP:login")
        return super().get(request, *args, **kwargs)


class LoginView(FormView):
    template_name = "login.html"
    form_class = LoginForm
    success_url = reverse_lazy("Attendance:list")

    def form_valid(self, form):
        # HttpRequest.session
        user = form.clean_user()
        if user is not None:
            login(self.request, user)
        return super().form_valid(form)

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect("Attendance:list")
        return super().get(request, *args, **kwargs)

class UsersListView(PermissionRequiredMixin,ListView):
    template_name = "list_users.html"
    model = User
    permission_required = ("VIPAlert.can_edit_users",)
    permission_denied_message = "Not allowed to be here, stay where you are should be."
    # paginate_by = Paginator.__str__()

    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect("VIP:login")
        return super().get(request, *args, **kwargs)


class AddUserView(CreateView):
    template_name = "add_edit_user.html"
    form_class = UserForm
    model = User
    success_url = reverse_lazy("VIP:users_list")

    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect("VIP:login")
        return super().get(request, *args, **kwargs)


class EditUserView(UpdateView):
    template_name = "add_edit_user.html"
    form_class = UserForm
    model = User
    success_url = reverse_lazy("VIP:users_list")

    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect("VIP:login")
        return super().get(request, *args, **kwargs)
