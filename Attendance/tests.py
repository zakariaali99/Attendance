import datetime
from django.test import TestCase, RequestFactory
from django.utils import timezone
from django.contrib.auth.models import Permission
from django.urls import reverse
from VIPAlert.models import User
from Attendance.models import Profile, Employee, ZKTDevice, Record, WorkDay, Exception, Holiday, Vacation, VacationType
from Attendance.views import AddEmployeeView, employee_day_rows
from Attendance.sync_records import sync_records

class AttendanceModelsTests(TestCase):
    def setUp(self):
        self.device = ZKTDevice.objects.create(ip="127.0.0.1", port=4370, name="Test Device")
        self.profile = Profile.objects.create(
            name="Test Profile",
            start_time=datetime.time(8, 0),
            end_time=datetime.time(16, 0),
            calculate_start_time=datetime.time(8, 0),
            calculate_end_time=datetime.time(16, 0),
            shift_start_time=datetime.time(7, 0),
            shift_end_time=datetime.time(17, 0),
        )
        self.employee = Employee.objects.create(
            name="John Doe",
            attendance_id="100",
            device=self.device,
            default_profile=self.profile,
            active=True
        )

    def test_record_status_choices(self):
        # Record should allow "attendance" as a status
        record = Record.objects.create(
            user_id="100",
            timestamp=timezone.now(),
            punch="1",
            device=self.device,
            status="attendance"
        )
        record.full_clean()  # Should not raise ValidationError
        self.assertEqual(record.status, "attendance")

    def test_holidays_count_uses_holiday_relation(self):
        weekday = datetime.date(2026, 4, 27)  # Monday
        workday = WorkDay.objects.create(date=weekday, employee=self.employee, device=self.device)
        Holiday.objects.create(date=weekday, employee=self.employee)
        self.employee.set_workdays([workday])
        self.assertEqual(self.employee.holidays_count, 1)

    def test_workday_shifts_no_crash_on_exceptions(self):
        # WorkDay.shifts() should not crash when exceptions are present
        today = timezone.now().date()
        wd = WorkDay.objects.create(
            date=today,
            employee=self.employee,
            device=self.device
        )
        
        Exception.objects.create(
            date=today,
            employee=self.employee,
            note="Late Exception",
            type="late"
        )
        
        # Add a single record to trigger the len() check on exceptions
        Record.objects.create(
            user_id="100",
            timestamp=datetime.datetime(today.year, today.month, today.day, 8, 30),
            punch="1",
            device=self.device
        )
        
        try:
            shifts = wd.shifts()
            self.assertIsNotNone(shifts)
        except TypeError as e:
            self.fail(f"shifts() raised TypeError: {e}")

class SyncRecordsTests(TestCase):
    def setUp(self):
        self.device = ZKTDevice.objects.create(ip="127.0.0.1", port=4370, name="Sync Device")
        self.employee = Employee.objects.create(
            name="Jane Doe",
            attendance_id="200",
            device=self.device,
            active=False
        )
        self.today = timezone.now().date()
        self.yesterday = self.today - datetime.timedelta(days=1)

    def test_sync_records_same_day(self):
        # Create an existing WorkDay for yesterday
        WorkDay.objects.create(date=self.yesterday, employee=self.employee, device=self.device)
        
        # New record arrives for yesterday (late punch)
        r1 = Record.objects.create(
            user_id="200",
            timestamp=datetime.datetime(self.yesterday.year, self.yesterday.month, self.yesterday.day, 20, 0),
            punch="1",
            device=self.device
        )
        
        # New record for today
        r2 = Record.objects.create(
            user_id="200",
            timestamp=datetime.datetime(self.today.year, self.today.month, self.today.day, 8, 0),
            punch="1",
            device=self.device
        )
        
        # Run sync
        sync_records(self.device, records=[r1, r2])
        
        # Workday for today should be created
        self.assertTrue(WorkDay.objects.filter(employee=self.employee, date=self.today).exists())
        # Workday for yesterday should still exist but no duplicate should be created
        self.assertEqual(WorkDay.objects.filter(employee=self.employee, date=self.yesterday).count(), 1)

class AttendancePermissionsTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(email="test@user.com", password="foo")
        self.admin = User.objects.create_superuser(email="admin@user.com", password="foo")
        
        from django.contrib.auth.models import Group
        # We assign permission to the user
        from django.contrib.contenttypes.models import ContentType
        # The content type for Employee doesn't strictly matter for custom permissions on the User model
        # if they were added via User meta, but let's check view behavior directly
        
    def test_add_employee_view_forbidden_for_anonymous(self):
        request = self.factory.get('/add-employee/')
        from django.contrib.auth.models import AnonymousUser
        request.user = AnonymousUser()
        
        view = AddEmployeeView.as_view()
        from django.core.exceptions import PermissionDenied
        
        # With raise_exception=True, missing login should raise PermissionDenied or redirect to login depending on settings,
        # but PermissionRequiredMixin generally raises if raise_exception is True and user is not authenticated.
        with self.assertRaises(PermissionDenied):
            view(request)


class AttendanceReportsTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.device = ZKTDevice.objects.create(ip="127.0.0.1", port=4370, name="Report Device")
        self.profile = Profile.objects.create(
            name="Report Profile",
            start_time=datetime.time(8, 0),
            end_time=datetime.time(16, 0),
            calculate_start_time=datetime.time(8, 0),
            calculate_end_time=datetime.time(16, 0),
            shift_start_time=datetime.time(7, 0),
            shift_end_time=datetime.time(17, 0),
            by_finger_print_count=False,
        )
        self.employee = Employee.objects.create(
            name="Report Employee",
            attendance_id="300",
            device=self.device,
            default_profile=self.profile,
            active=False,
        )
        self.user = User.objects.create_user(email="reports@example.com", password="secret123")
        permission = Permission.objects.get(codename="can_view_employees")
        self.user.user_permissions.add(permission)
        self.client.force_login(self.user)

    def test_employee_day_rows_include_absent_and_vacation_days(self):
        from_date = datetime.date(2026, 4, 27)
        to_date = datetime.date(2026, 4, 29)
        WorkDay.objects.create(date=from_date, employee=self.employee, device=self.device)
        vacation_type = VacationType.objects.create(title="Annual")
        Vacation.objects.create(
            date=datetime.date(2026, 4, 28),
            to_date=datetime.date(2026, 4, 28),
            employee=self.employee,
            note="Annual leave",
            vacation_type=vacation_type,
        )
        self.employee.set_workdays(list(WorkDay.objects.filter(employee=self.employee)))
        rows = employee_day_rows(self.employee, from_date, to_date)
        self.assertEqual([row["status_code"] for row in rows], ["present", "vacation", "absent"])

    def test_monthly_register_page_loads(self):
        response = self.client.get(reverse("Attendance:monthly_register"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "سجل الحضور الشهري")

    def test_settings_page_loads(self):
        response = self.client.get(reverse("Attendance:settings"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "الإعدادات")

    def test_add_employee_view_forbidden_for_normal_user(self):
        request = self.factory.get('/add-employee/')
        request.user = self.user
        
        view = AddEmployeeView.as_view()
        from django.core.exceptions import PermissionDenied
        
        with self.assertRaises(PermissionDenied):
            view(request)
