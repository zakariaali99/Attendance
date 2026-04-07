from rest_framework import serializers
from django.contrib.auth.models import Permission
from .models import User


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = "__all__"


class UserSerializer(serializers.ModelSerializer):
    user_permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        exclude = ["password", "is_admin", "is_staff", "email", "last_login", "is_superuser", "groups"]

    def get_user_permissions(self, obj):
        return PermissionSerializer(obj.user_permissions.all(), many=True).data
