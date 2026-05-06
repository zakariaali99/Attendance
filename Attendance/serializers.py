from rest_framework import serializers
from .models import *  # noqa: F401,F403

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = [
            "id", "name", "phone", "attendance_id", "device",
            "default_profile", "active", "current_vacations",
        ]

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "id", "name", "full_month_work", "start_time", "end_time",
            "allowed_start_time", "calculate_start_time", "allowed_end_time",
            "calculate_end_time", "next_day", "extra", "hourly",
            "auto_open", "auto_close", "days",
            "shift_start_time", "shift_end_time", "shift_end_next_day",
            "by_finger_print_count", "late_threshold",
        ]

class RecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Record
        fields = [
            "id", "user_id", "timestamp", "punch", "uid", "device", "status", "note",
        ]

class ZKTDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ZKTDevice
        fields = [
            "id", "ip", "port", "name", "out_during_work",
        ]

class VacationSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.name')
    class Meta:
        model = Vacation
        fields = [
            "id", "date", "to_date", "employee", "employee_name", "note", "vacation_type",
        ]

class WorkDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkDay
        fields = [
            "id", "date", "employee", "device",
            "late_seconds", "work_hours", "overwork_hours", "out_return_hours",
        ]
