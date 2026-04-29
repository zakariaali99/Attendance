from urllib.parse import urlencode

from django.conf import settings
from django.shortcuts import redirect
from django.urls import reverse


class LoginRequiredMiddleware:
    """Redirect anonymous page requests to the system login screen."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if self._requires_login(request):
            login_url = reverse("VIP:login")
            query = urlencode({"next": request.get_full_path()})
            return redirect(f"{login_url}?{query}")
        return self.get_response(request)

    def _requires_login(self, request):
        if request.user.is_authenticated:
            return False

        path = request.path_info
        public_paths = (
            reverse("VIP:login"),
            settings.STATIC_URL,
            "/admin/login/",
        )
        return not any(path.startswith(public_path) for public_path in public_paths)
