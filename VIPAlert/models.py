from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Must Enter email")
        extra_fields.setdefault('is_active', True)
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_staffuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_admin', False)
        extra_fields.setdefault('is_superuser', False)
        return self.create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_admin', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


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
    is_active = models.BooleanField(
        _('active'),
        default=True,
        help_text=_(
            'Designates whether this user should be treated as active. '
            'Unselect this instead of deleting accounts.'
        ),
    )
    is_staff = models.BooleanField(
        _('staff status'),
        default=False,
        help_text=_('Designates whether the user can log into this admin site.'),
    )
    is_admin = models.BooleanField(
        _('admin status'),
        default=False,
        help_text=_('Designates whether the user has admin privileges.'),
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
