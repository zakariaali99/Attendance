from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, datetime, time
import random


class Command(BaseCommand):
    help = 'Create comprehensive test data for attendance system'

    def handle(self, *args, **options):
        from Attendance.models import Employee, ZKTDevice, Profile, Day, WorkDay, Record

        self.stdout.write('Creating comprehensive test data...')

        # Create device
        device, created = ZKTDevice.objects.get_or_create(
            ip='192.168.1.100',
            defaults={'name': 'Test Device', 'port': 4370}
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created device: Test Device'))

        # Create profile
        profile, created = Profile.objects.get_or_create(
            name='Regular Shift',
            defaults={
                'start_time': time(9, 0),
                'end_time': time(17, 0),
                'allowed_start_time': time(8, 0),
                'calculate_start_time': time(9, 0),
                'allowed_end_time': time(18, 0),
                'calculate_end_time': time(17, 0),
                'shift_start_time': time(9, 0),
                'shift_end_time': time(17, 0),
                'late_threshold': 15,
            }
        )
        if created:
            for day_num in range(2, 7):
                day_obj, _ = Day.objects.get_or_create(day=str(day_num))
                profile.days.add(day_obj)
            self.stdout.write(self.style.SUCCESS('Created profile: Regular Shift'))

        # Create employees
        employee_data = [
            ('أحمد', 'عبدالله', '1000'),
            ('محمد', 'على', '1001'),
            ('عبدالله', 'يوسف', '1002'),
            ('فاطمة', 'أحمد', '1003'),
            ('مريم', 'على', '1004'),
            ('سارة', 'خالد', '1005'),
            ('عمر', 'محمد', '1006'),
            ('ليلى', 'حسن', '1007'),
            ('يوسف', 'ابراهيم', '1008'),
            ('هدى', 'عصام', '1009'),
            ('كريم', 'سمير', '1010'),
            ('نور', 'الدين', '1011'),
            ('اسما', 'حمادة', '1012'),
            ('خالد', 'ابراهيم', '1013'),
            ('على', 'أحمد', '1014'),
        ]

        employees = []
        for first, last, emp_id in employee_data:
            name = first + ' ' + last
            emp, created = Employee.objects.get_or_create(
                attendance_id=emp_id,
                defaults={
                    'name': name,
                    'device': device,
                    'default_profile': profile,
                    'active': True,
                    'phone': '010' + emp_id + str(random.randint(1000, 9999))
                }
            )
            employees.append(emp)
            if created:
                self.stdout.write('Created: ' + name)

        # Clear old data
        Record.objects.all().delete()
        WorkDay.objects.all().delete()

        # Generate records for past 30 days
        today = timezone.now().date()
        records_created = 0
        workdays_created = 0

        for emp in employees:
            for days_ago in range(30, -1, -1):
                day = today - timedelta(days=days_ago)
                
                if day.weekday() >= 4:
                    continue

                if random.random() < 0.85:
                    # Check-in: mostly on time (8:00-9:45)
                    check_in_hour = random.choices([8, 9], weights=[30, 70])[0]
                    check_in_min = random.randint(30 if check_in_hour == 8 else 0, 59)
                    check_in = timezone.make_aware(
                        datetime.combine(day, time(check_in_hour, check_in_min))
                    )

                    # Check-out: mostly around 17:00-18:30
                    check_out_hour = random.choice([16, 17, 18])
                    check_out_min = random.randint(0, 59)
                    check_out = timezone.make_aware(
                        datetime.combine(day, time(check_out_hour, check_out_min))
                    )

                    Record.objects.create(
                        user_id=emp.attendance_id,
                        timestamp=check_in,
                        punch='0',
                        device=device,
                        status='attendance'
                    )
                    records_created += 1

                    Record.objects.create(
                        user_id=emp.attendance_id,
                        timestamp=check_out,
                        punch='1',
                        device=device,
                        status='attendance'
                    )
                    records_created += 1

                    work_day = WorkDay.objects.create(
                        employee=emp,
                        date=day,
                        device=device
                    )
                    work_day.update_totals(save=True)
                    workdays_created += 1

        # Show results
        self.stdout.write(self.style.SUCCESS(
            '\nCreated ' + str(records_created) + ' attendance records'))
        self.stdout.write(self.style.SUCCESS(
            'Created ' + str(workdays_created) + ' work days'))

        total_hours = sum(wd.work_hours for wd in WorkDay.objects.all())
        total_late = sum(wd.late_seconds for wd in WorkDay.objects.all()) / 60

        self.stdout.write(self.style.SUCCESS(
            '\nTotal Work Hours: ' + str(round(total_hours, 1))))
        self.stdout.write(self.style.SUCCESS(
            'Total Late Minutes: ' + str(round(total_late, 0))))