import random
from datetime import datetime, time, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from Attendance.models import Employee, Record, WorkDay, Profile, ZKTDevice, Vacation, VacationType, Exception as AttendanceException, Day

User = get_user_model()

class Command(BaseCommand):
    help = 'Clears old data and seeds the database with new Al-Khwarizmi system data'

    def handle(self, *args, **kwargs):
        self.stdout.write("Clearing old data...")
        # Clear all data
        Record.objects.all().delete()
        WorkDay.objects.all().delete()
        AttendanceException.objects.all().delete()
        Vacation.objects.all().delete()
        VacationType.objects.all().delete()
        Employee.objects.all().delete()
        Profile.objects.all().delete()
        Day.objects.all().delete()
        ZKTDevice.objects.all().delete()
        User.objects.all().delete()

        self.stdout.write("Seeding new data...")

        # Create Days
        day_names = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"]
        days = []
        for i, name in enumerate(day_names):
            d = Day.objects.create(day=str(i))
            days.append(d)

        # Create Profiles
        p1 = Profile.objects.create(
            name="الوردية الصباحية",
            start_time=time(8, 0),
            end_time=time(16, 0),
            allowed_start_time=time(7, 30),
            calculate_start_time=time(8, 15),
            allowed_end_time=time(16, 30),
            calculate_end_time=time(15, 45),
            shift_start_time=time(7, 0),
            shift_end_time=time(17, 0)
        )
        p1.days.add(*days[1:6]) # Sun to Thu

        p2 = Profile.objects.create(
            name="الوردية المسائية",
            start_time=time(16, 0),
            end_time=time(0, 0),
            allowed_start_time=time(15, 30),
            calculate_start_time=time(16, 15),
            allowed_end_time=time(0, 30),
            calculate_end_time=time(23, 45),
            shift_start_time=time(15, 0),
            shift_end_time=time(1, 0),
            next_day=True
        )
        p2.days.add(*days[1:6])

        # Create Devices
        device1 = ZKTDevice.objects.create(name="مدخل الموظفين الرئيسي", ip="192.168.1.100", port=4370)
        device2 = ZKTDevice.objects.create(name="مبنى الإدارة", ip="192.168.1.101", port=4370, out_during_work=True)

        # Create Admin User
        User.objects.create_superuser(email="admin@khwarizmi.com", password="admin")

        # Create Vacation Types
        v_types = ["سنوية", "مرضية", "عارضة", "مهمة عمل"]
        vacation_types = [VacationType.objects.create(title=t) for t in v_types]

        # Arabic Names for employees
        first_names = ["أحمد", "محمد", "علي", "محمود", "عمر", "خالد", "ياسين", "إبراهيم", "فاطمة", "زينب", "سارة", "مريم", "نور", "ليلى", "هدى", "منى"]
        last_names = ["منصور", "زيدان", "عيسى", "الخطيب", "سالم", "عثمان", "النجار", "شاكر", "عبد العزيز", "رضوان", "فكري"]

        employees = []
        for i in range(1, 26):
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            emp = Employee.objects.create(
                name=name,
                attendance_id=str(5000 + i),
                phone=f"01{''.join([str(random.randint(0,9)) for _ in range(9)])}",
                device=device1,
                default_profile=p1 if i % 2 != 0 else p2,
                current_vacations=random.randint(15, 30)
            )
            employees.append(emp)

        # Create WorkDays and Records for the last 5 days
        today = timezone.now().date()
        for i in range(5):
            date = today - timedelta(days=i)
            # Skip Friday (6) and Saturday (0) if we want mostly working days
            if date.weekday() in [4, 5]: # Fri, Sat in Python (Mon=0)
                continue
            
            for emp in employees:
                # 90% attendance rate
                if random.random() < 0.9:
                    wd = WorkDay.objects.create(date=date, employee=emp, device=device1)
                    
                    # Create Check-in Record
                    checkin_time = datetime.combine(date, emp.default_profile.start_time) + timedelta(minutes=random.randint(-15, 30))
                    Record.objects.create(
                        user_id=emp.attendance_id,
                        timestamp=timezone.make_aware(checkin_time),
                        punch="0",
                        device=device1,
                        status="attendance"
                    )
                    
                    # Create Check-out Record
                    checkout_time = datetime.combine(date, emp.default_profile.end_time) + timedelta(minutes=random.randint(-10, 20))
                    if emp.default_profile.next_day:
                        checkout_time += timedelta(days=1)
                    
                    Record.objects.create(
                        user_id=emp.attendance_id,
                        timestamp=timezone.make_aware(checkout_time),
                        punch="1",
                        device=device1,
                        status="attendance"
                    )

        # Add some sample exceptions/vacations
        for _ in range(5):
            emp = random.choice(employees)
            AttendanceException.objects.create(
                date=today,
                employee=emp,
                note="تأخير بعذر",
                type="late"
            )

        for _ in range(3):
            emp = random.choice(employees)
            Vacation.objects.create(
                date=today + timedelta(days=1),
                to_date=today + timedelta(days=3),
                employee=emp,
                note="إجازة سنوية",
                vacation_type=vacation_types[0]
            )

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
