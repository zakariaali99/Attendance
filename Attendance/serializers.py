from rest_framework import serializers
from .models import *

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = "__all__"

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = "__all__"

class RecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Record
        fields = "__all__"

class ZKTDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ZKTDevice
        fields = "__all__"

class VacationSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.name')
    class Meta:
        model = Vacation
        fields = "__all__"

class WorkDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkDay
        fields = "__all__"
