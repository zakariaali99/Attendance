from django.contrib import admin
from django.urls import path, include
from Attendance.views import *
from Attendance.api_views import *

app_name = "Attendance"

urlpatterns = [

    path('', DashboardView.as_view(), name="dashboard"),
    path('list', EmployeeView.as_view(), name="list"),
    path('create', AddEmployeeView.as_view(), name="add"),
    path('edit/<int:pk>', EditEmployeeView.as_view(), name="edit"),
    path('delete/<int:pk>', DeleteEmployeeView.as_view(), name="delete"),
    path('records/<int:pk>', EmployeeRecordsView.as_view(), name="records"),
    path('permission/<str:pk>', AddPermission.as_view(), name="permission"),
    path('records/<int:pk>/export', ExportEmployeeReportView.as_view(), name="export_employee_report"),

    path('profile/', ProfileListView.as_view(), name="profiles"),
    path('profile/create', AddProfileView.as_view(), name="add_profile"),
    path('profile/edit/<int:pk>', EditProfileView.as_view(), name="edit_profile"),
    path('profile/delete/<int:pk>', DeleteProfileView.as_view(), name="delete_profile"),
    path('report', ReportView.as_view(), name="report"),
    path('report/export', ExportReportView.as_view(), name="export_report"),
    path('report/payroll-summary', ExportPayrollSummaryView.as_view(), name="export_payroll_summary"),
    path('report/register', MonthlyRegisterView.as_view(), name="monthly_register"),
    path('report/register/export', ExportMonthlyRegisterView.as_view(), name="export_monthly_register"),

    path('devices/', DeviceListView.as_view(), name="devices"),
    path('devices/sync', SyncDevicesView.as_view(), name="sync_devices"),
    path('devices/test-connection', TestDeviceConnectionView.as_view(), name="test_connection"),
    path('devices/create', AddDeviceView.as_view(), name="add_devices"),
    path('devices/edit/<int:pk>', EditDeviceView.as_view(), name="edit_devices"),
    path('devices/delete/<int:pk>', DeleteDeviceView.as_view(), name="delete_devices"),

    
    path('vacation/', AddVacationsView.as_view(), name="add_vacation"),
    path('vacation/view', VacationsView.as_view(), name="vacation"),
    path('vacation/<int:pk>/edit', EditVacationView.as_view(), name="edit_vacation"),
    path('vacation/<int:pk>/delete', DeleteVacationView.as_view(), name="delete_vacation"),
    path('vacation/types', VacationTypeView.as_view(), name="vacation_types"),
    path('vacation/types/<int:pk>', EditVacationTypeView.as_view(), name="edit_vacation_type"),
    path('vacation/types/<int:pk>/delete', DeleteVacationTypeView.as_view(), name="delete_vacation_type"),
    path('vacation/types/add', AddVacationTypeView.as_view(), name="add_vacation_type"),

    path('exception/', AddExceptionsView.as_view(), name="add_exception"),
    path('exception/view', ExceptionsView.as_view(), name="exception"),
    path('exception/<int:pk>/edit', EditExceptionView.as_view(), name="edit_exception"),
    path('exception/<int:pk>/delete', DeleteExceptionView.as_view(), name="delete_exception"),
    path('import', ImportRecordsView.as_view(), name="import_records"),
    path('settings', SettingsView.as_view(), name="settings"),

    # API Endpoints
    path('api/employees/', EmployeeList.as_view(), name="api_employee_list"),
    path('api/employees/<int:pk>/', EmployeeDetail.as_view(), name="api_employee_detail"),
    path('api/devices/', DeviceList.as_view(), name="api_device_list"),
    path('api/profiles/', ProfileList.as_view(), name="api_profile_list"),
    path('api/records/', RecordList.as_view(), name="api_record_list"),
    path('api/vacations/', VacationList.as_view(), name="api_vacation_list"),
]
