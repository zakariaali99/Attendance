from django.contrib import admin
from .models import (
    Employee, Profile, Record, ZKTDevice, Day,
    Vacation, VacationType, AttendanceException, ExceptionType,
    ExtraWork, WorkDay, Holiday
)


class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('name', 'attendance_id', 'phone', 'active', 'current_vacations', 'default_profile')
    list_filter = ('active', 'default_profile')
    search_fields = ('name', 'attendance_id', 'phone')
    raw_id_fields = ('default_profile', 'device')

class ProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'full_month_work', 'start_time', 'end_time', 'late_threshold')
    filter_horizontal = ('days',)

class RecordAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'timestamp', 'status', 'device')
    list_filter = ('status', 'device')
    search_fields = ('user_id', 'uid')
    date_hierarchy = 'timestamp'

class ZKTDeviceAdmin(admin.ModelAdmin):
    list_display = ('name', 'ip', 'port', 'out_during_work')

class VacationAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'to_date', 'vacation_type')
    list_filter = ('vacation_type',)
    search_fields = ('employee__name', 'note')
    date_hierarchy = 'date'

class WorkDayAdmin(admin.ModelAdmin):
    list_display = ('date', 'employee', 'work_hours', 'late_seconds')
    list_filter = ('date',)
    search_fields = ('employee__name',)
    date_hierarchy = 'date'

admin.site.register(Employee, EmployeeAdmin)
admin.site.register(Profile, ProfileAdmin)
admin.site.register(Record, RecordAdmin)
admin.site.register(ZKTDevice, ZKTDeviceAdmin)
admin.site.register(Day)
admin.site.register(Vacation, VacationAdmin)
admin.site.register(VacationType)
admin.site.register(AttendanceException)
admin.site.register(ExceptionType)
admin.site.register(ExtraWork)
admin.site.register(WorkDay, WorkDayAdmin)
admin.site.register(Holiday)
