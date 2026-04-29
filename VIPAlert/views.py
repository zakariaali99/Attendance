from django.contrib.auth import login, logout
from django.contrib.auth.mixins import PermissionRequiredMixin, LoginRequiredMixin
from django.shortcuts import redirect, get_object_or_404
from django.conf import settings
from django.urls import reverse_lazy
from django.utils.http import url_has_allowed_host_and_scheme
from django.views import View
from django.views.generic import TemplateView, ListView, UpdateView, CreateView, FormView, DeleteView
from VIPAlert.forms import LoginForm, UserForm
from VIPAlert.models import User, SystemLog
from django.contrib import messages


def ensure_default_admin():
    # We no longer reset the admin password to 'admin' every time for security.
    # The user 'zak' is the main superuser.
    pass


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
        user = form.clean_user()
        if user is not None:
            login(self.request, user)
            SystemLog.objects.create(
                user=user,
                action="دخول",
                description=f"قام المستخدم {user.name or user.email} بتسجيل الدخول للنظام.",
                ip_address=self.request.META.get('REMOTE_ADDR'),
                path=self.request.path
            )
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

    def form_valid(self, form):
        response = super().form_valid(form)
        SystemLog.objects.create(
            user=self.request.user,
            action="إضافة مستخدم",
            description=f"تم إضافة مستخدم جديد: {self.object.name or self.object.email}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return response


class EditUserView(PermissionRequiredMixin, UpdateView):
    template_name = "add_edit_user.html"
    form_class = UserForm
    model = User
    success_url = reverse_lazy("VIP:users_list")
    permission_required = ("VIPAlert.can_edit_users",)
    raise_exception = True

    def form_valid(self, form):
        response = super().form_valid(form)
        SystemLog.objects.create(
            user=self.request.user,
            action="تعديل مستخدم",
            description=f"تم تعديل بيانات المستخدم: {self.object.name or self.object.email}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return response


class DeleteUserView(PermissionRequiredMixin, DeleteView):
    model = User
    success_url = reverse_lazy("VIP:users_list")
    permission_required = ("VIPAlert.can_delete_users",)

    def delete(self, request, *args, **kwargs):
        user_to_delete = self.get_object()
        
        # Protection: Cannot delete superuser 'zak' or self
        if user_to_delete.email == 'zak@system.local' or user_to_delete == request.user:
            messages.error(request, "لا يمكنك حذف هذا المستخدم.")
            return redirect("VIP:users_list")
            
        SystemLog.objects.create(
            user=request.user,
            action="حذف مستخدم",
            description=f"تم حذف المستخدم: {user_to_delete.name or user_to_delete.email}",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return super().delete(request, *args, **kwargs)


class SystemLogListView(PermissionRequiredMixin, ListView):
    model = SystemLog
    template_name = "system_logs.html"
    permission_required = ("VIPAlert.can_view_logs",)
    paginate_by = 50


class UserTraceView(PermissionRequiredMixin, ListView):
    model = SystemLog
    template_name = "system_logs.html"
    permission_required = ("VIPAlert.can_view_logs",)
    paginate_by = 50

    def get_queryset(self):
        user_id = self.kwargs.get('pk')
        return SystemLog.objects.filter(user_id=user_id)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['trace_user'] = get_object_or_404(User, pk=self.kwargs.get('pk'))
        return context
