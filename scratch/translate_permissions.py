from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType

mapping = {
    # VIPAlert
    'can_create_users': 'إضافة مستخدمين',
    'can_delete_users': 'حذف مستخدمين',
    'can_edit_users': 'تعديل مستخدمين',
    'can_view_users': 'عرض المستخدمين',
    'can_view_logs': 'عرض سجلات النظام',
    'can_change_users_passwords': 'تغيير كلمات المرور',
    
    # Attendance
    'can_create_employees': 'إضافة موظفين',
    'can_delete_employees': 'حذف موظفين',
    'can_edit_employees': 'تعديل موظفين',
    'can_view_employees': 'عرض الموظفين',
    'can_create_profiles': 'إضافة أنظمة دوام',
    'can_delete_profiles': 'حذف أنظمة دوام',
    'can_edit_profiles': 'تعديل أنظمة دوام',
    'can_view_profiles': 'عرض أنظمة الدوام',
    'can_manage_attendance': 'إدارة الحضور والانصراف',
    'can_manage_devices': 'إدارة الأجهزة',
    'can_manage_vacations': 'إدارة الإجازات',
    'can_view_reports': 'عرض التقارير',
    'can_view_employee_records': 'عرض سجلات الموظف',
}

for codename, new_name in mapping.items():
    Permission.objects.filter(codename=codename).update(name=new_name)

print("Permissions updated successfully.")
