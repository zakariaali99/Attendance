from django.contrib.auth import login
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.shortcuts import redirect
from django.conf import settings
from django.urls import reverse_lazy
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.generic import TemplateView, ListView, UpdateView, CreateView, FormView
from VIPAlert.forms import LoginForm, UserForm
from VIPAlert.models import User


def ensure_default_admin():
    admin_user = User.objects.filter(email__iexact="admin").first()
    if admin_user is None:
        admin_user = User.objects.create_superuser(
            email="admin",
            password="admin",
            name="admin",
        )
    else:
        admin_user.name = admin_user.name or "admin"
        admin_user.is_active = True
        admin_user.is_staff = True
        admin_user.is_admin = True
        admin_user.is_superuser = True
        admin_user.set_password("admin")
        admin_user.save(update_fields=["name", "is_active", "is_staff", "is_admin", "is_superuser", "password"])
    return admin_user


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

    def dispatch(self, request, *args, **kwargs):
        ensure_default_admin()
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        # HttpRequest.session
        user = form.clean_user()
        if user is not None:
            login(self.request, user)
        return super().form_valid(form)

    def get_success_url(self):
        next_url = self.request.GET.get("next")
        if next_url and url_has_allowed_host_and_scheme(
            next_url,
            allowed_hosts={self.request.get_host()},
            require_https=self.request.is_secure(),
        ):
            return next_url
        return settings.LOGIN_REDIRECT_URL

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect(self.get_success_url())
        return super().get(request, *args, **kwargs)


class UsersListView(PermissionRequiredMixin, ListView):
    template_name = "list_users.html"
    model = User
    permission_required = ("VIPAlert.can_edit_users",)
    permission_denied_message = "Not allowed to be here, stay where you are should be."
    # paginate_by = Paginator.__str__()

    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect("VIP:login")
        return super().get(request, *args, **kwargs)


class AddUserView(PermissionRequiredMixin, CreateView):
    template_name = "add_edit_user.html"
    form_class = UserForm
    model = User
    success_url = reverse_lazy("VIP:users_list")
    permission_required = ("VIPAlert.can_create_users",)
    raise_exception = True


class EditUserView(PermissionRequiredMixin, UpdateView):
    template_name = "add_edit_user.html"
    form_class = UserForm
    model = User
    success_url = reverse_lazy("VIP:users_list")
    permission_required = ("VIPAlert.can_edit_users",)
    raise_exception = True
