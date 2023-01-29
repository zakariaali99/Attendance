from rest_framework import serializers
from django.contrib.auth.models import Permission
from .models import *
import json

class PaymentsSerializer(serializers.ModelSerializer):
     class Meta:
            model = Payments
            fields = "__all__"

class AccountSerializer(serializers.ModelSerializer):
     class Meta:
            model = Account
            fields = "__all__"


class PermissionSerializer(serializers.ModelSerializer):
     class Meta:
            model = Permission
            fields = "__all__"



class UserSerializer(serializers.ModelSerializer):
     user_permissions = serializers.SerializerMethodField()
     
     class Meta:
          model = User
          #   fields = "__all__"
          exclude = ["password", "is_admin", "is_staff", "email","last_login", "is_superuser","groups"]

     def get_user_permissions(self, obj):
        return PermissionSerializer(obj.user_permissions.all(), many=True).data


class CitySerializer(serializers.ModelSerializer):
     class Meta:
            model = City
            fields = "__all__"

