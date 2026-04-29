from django.test import TestCase
from django.urls import reverse
from VIPAlert.models import User
from VIPAlert.forms import LoginForm
from VIPAlert.views import ensure_default_admin

class UserManagerTests(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(email='normal@user.com', password='foo')
        self.assertEqual(user.email, 'normal@user.com')
        self.assertFalse(user.is_admin)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.check_password('foo'))

    def test_create_superuser(self):
        admin_user = User.objects.create_superuser(email='super@user.com', password='foo')
        self.assertEqual(admin_user.email, 'super@user.com')
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_admin)
        self.assertTrue(admin_user.is_superuser)

    def test_create_superuser_missing_is_staff(self):
        with self.assertRaisesMessage(ValueError, 'Superuser must have is_staff=True.'):
            User.objects.create_superuser(email='super2@user.com', password='foo', is_staff=False)

    def test_default_admin_can_login_with_admin_identifier(self):
        ensure_default_admin()
        form = LoginForm(data={"identifier": "admin", "password": "admin"})
        self.assertTrue(form.is_valid())
        self.assertEqual(form.clean_user().email, "admin")


class AuthenticationFlowTests(TestCase):
    def test_anonymous_system_page_redirects_to_login(self):
        response = self.client.get(reverse("Attendance:dashboard"))
        self.assertRedirects(
            response,
            f"{reverse('VIP:login')}?next=/",
            fetch_redirect_response=False,
        )

    def test_login_honors_next_url(self):
        ensure_default_admin()
        response = self.client.post(
            f"{reverse('VIP:login')}?next=/",
            {"identifier": "admin", "password": "admin"},
        )
        self.assertRedirects(response, "/", fetch_redirect_response=False)

    def test_logout_returns_to_login(self):
        user = User.objects.create_user(email="logout@example.com", password="secret123")
        self.client.force_login(user)
        response = self.client.get(reverse("VIP:logout"))
        self.assertRedirects(response, reverse("VIP:login"), fetch_redirect_response=False)
