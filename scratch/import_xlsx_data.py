import os
import sys
import django
import xlrd
from datetime import datetime as py_datetime, timedelta
from django.utils import timezone

# Add the project root to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "HTI.settings")
django.setup()

from Attendance.models import *
from Attendance.sync_records import sync_records

def import_data(file_path):
    # 1. Create Default Device
    device, _ = ZKTDevice.objects.get_or_create(
        name="جهاز رئيسي",
        ip="0.0.0.0",
        port=4370
    )
    
    # 2. Create Default Profile (08:00 - 16:00)
    # Day.days = [(0, "السبت"), (1, "الأحد"), (2, "الاثنين"), (3, "الثلاثاء"), (4, "الأربعاء"), (5, "الخميس"), (6, "الجمعة")]
    # Work days: 1 (Sun) to 5 (Thu)
    profile, _ = Profile.objects.get_or_create(
        name="الوردية الأساسية",
        defaults={
            'start_time': py_datetime.strptime("08:00", "%H:%M").time(),
            'end_time': py_datetime.strptime("16:00", "%H:%M").time(),
            'allowed_start_time': py_datetime.strptime("07:30", "%H:%M").time(),
            'calculate_start_time': py_datetime.strptime("08:00", "%H:%M").time(),
            'allowed_end_time': py_datetime.strptime("16:30", "%H:%M").time(),
            'calculate_end_time': py_datetime.strptime("16:00", "%H:%M").time(),
            'late_threshold': 15
        }
    )
    work_days = Day.objects.filter(day__in=['1', '2', '3', '4', '5'])
    profile.days.set(work_days)
    
    # 3. Read Excel
    wb = xlrd.open_workbook(file_path)
    sheet = wb.sheets()[0]
    
    headers = [str(sheet.cell_value(0, i)).strip() for i in range(sheet.ncols)]
    col_map = {
        'id': headers.index('رقم البصمه'),
        'timestamp': headers.index('التاريخ والوقت'),
        'punch': headers.index('طريقة التسجيل') if 'طريقة التسجيل' in headers else -1,
    }
    
    employees_cache = {}
    records_to_create = []
    
    print(f"Processing {sheet.nrows - 1} rows...")
    
    for r in range(1, sheet.nrows):
        emp_id_val = sheet.cell_value(r, col_map['id'])
        try:
            emp_id = str(int(float(emp_id_val)))
        except:
            emp_id = str(emp_id_val)
            
        if emp_id not in employees_cache:
            employee, _ = Employee.objects.get_or_create(
                attendance_id=emp_id,
                defaults={
                    'name': None,
                    'device': device,
                    'default_profile': profile
                }
            )
            employees_cache[emp_id] = employee
            
        ts_val = sheet.cell_value(r, col_map['timestamp'])
        # Convert Excel date
        base = py_datetime(1899, 12, 30)
        dt = base + timedelta(days=ts_val)
        
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt)
            
        punch = "IMPORT"
        if col_map['punch'] != -1:
            punch = str(sheet.cell_value(r, col_map['punch']))
            
        records_to_create.append(Record(
            user_id=emp_id,
            timestamp=dt,
            punch=punch,
            device=device,
            note="Initial Data Import"
        ))
        
        if len(records_to_create) >= 500:
            Record.objects.bulk_create(records_to_create)
            records_to_create = []
            
    if records_to_create:
        Record.objects.bulk_create(records_to_create)
        
    print(f"Imported {len(employees_cache)} employees and all records.")
    
    # 4. Sync WorkDays
    print("Syncing workdays...")
    sync_records(device=device)
    print("Done.")

if __name__ == "__main__":
    import_data('data/InOutData.xls')
