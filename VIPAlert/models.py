from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, admin=False):
        if not email:
            raise ValueError("Must Enter email")
        user_object = self.model()
        if email:
            user_object.email = email

        if password:
            user_object.set_password(password)

        user_object.is_admin = admin
        user_object.save(using=self._db)
        return user_object

    def create_staffuser(self, email=None, password=None):

        return self.create_user(
            email=email,
            password=password,
            admin=False,
        )

    def create_superuser(self, email, password=None):
        return self.create_user(
            email=email,
            password=password,
            admin=True
        )


class User(AbstractBaseUser, PermissionsMixin):
    user_types = [
        (0, "None"),
        (1, "Admin"),
        (2, "Technical"),
        (3, "Accountant"),
    ]
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=4096, blank=True, null=True)
    email = models.EmailField(unique=True)
    is_staff = models.BooleanField(
        _('active'),
        default=True,
        help_text=_(
            'Designates whether this user should be treated as active. '
            'Unselect this instead of deleting accounts.'
        ),
    )
    is_admin = models.BooleanField(
        _('active'),
        default=True,
        help_text=_(
            'Designates whether this user should be treated as active. '
            'Unselect this instead of deleting accounts.'
        ),
    )
    user_type = models.IntegerField(default=1, choices=user_types)
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'

    def __str__(self):
        if self.name:
            return self.name
        return super().__str__()

    class Meta:
        permissions = [
            ("can_view_users", "View Users"),
            ("can_create_users", "Create Users"),
            ("can_edit_users", "Edit Users"),
            ("can_delete_users", "Delete Users"),
            ("can_change_users_passwords", "Change users passwords"),

        ]

    def can_view_users(self):
        return self.has_perm('can_view_users')
