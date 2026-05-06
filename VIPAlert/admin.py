from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from VIPAlert.models import User, SystemLog


class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'is_admin', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_admin', 'is_staff', 'is_active', 'user_type')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'user_type')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_admin', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2', 'user_type'),
        }),
    )
    search_fields = ('email', 'name')
    ordering = ('email',)
    filter_horizontal = ('groups', 'user_permissions',)

class SystemLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'level', 'action', 'ip_address')
    list_filter = ('level', 'timestamp')
    search_fields = ('action', 'description', 'user__email', 'ip_address')
    readonly_fields = ('timestamp',)
    date_hierarchy = 'timestamp'

admin.site.register(User, UserAdmin)
admin.site.register(SystemLog, SystemLogAdmin)
