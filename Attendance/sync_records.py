import calendar
import os
import sys
from pathlib import Path
from datetime import date
import django
from django.utils import timezone


def sync_records(device=None, records=None):
    from Attendance.models import Record, Employee, WorkDay
    from django.db.models import Q

    if records is None:
        # Get the latest existing workday for this device to avoid re-processing old records
        workdays_query = WorkDay.objects.filter(device=device).order_by("-date")
        workday = workdays_query.first()
        # Avoid pulling all records into memory at once if unnecessary
        if workday:
            records = Record.objects.filter(device=device, timestamp__date__gte=workday.date)
        else:
            records = Record.objects.filter(device=device)

    # Accumulate unique [user_id: [dates]] pairs from the provided records
    days = {}
    all_dates = set()
    for r in records:
        r_date = r.timestamp.date()
        all_dates.add(r_date)
        if r.user_id not in days:
            days[r.user_id] = {r_date}
        else:
            days[r.user_id].add(r_date)

    if not days:
        return {}

    # Fetch all relevant employees at once
    attendance_ids = list(days.keys())
    employees = {e.attendance_id: e for e in Employee.objects.filter(attendance_id__in=attendance_ids)}
    
    # Fetch existing workdays for these employees and dates to avoid duplicates
    existing_wds_query = WorkDay.objects.filter(
        device=device, 
        date__in=list(all_dates), 
        employee__attendance_id__in=attendance_ids
    ).select_related('employee')
    
    existing_wds = {}
    for wd in existing_wds_query:
        existing_wds[(wd.employee.attendance_id, wd.date)] = wd

    new_workdays = []
    affected_workdays = []
    this_year = timezone.now().year

    for attendance_id, unique_dates in days.items():
        employee = employees.get(attendance_id)
        if not employee:
            continue

        for d in unique_dates:
            if d.year > this_year + 5: continue # Sanity check
            
            wd = existing_wds.get((attendance_id, d))
            if wd:
                affected_workdays.append(wd)
            else:
                wd = WorkDay(date=d, employee=employee, device=device)
                new_workdays.append(wd)
                affected_workdays.append(wd)

    if new_workdays:
        WorkDay.objects.bulk_create(new_workdays)
        print(f"Successfully generated {len(new_workdays)} new workdays.")

    # Update totals for all affected workdays (new and updated)
        # Note: We need to re-fetch or ensure they have IDs if we want to save them individually,
        # but since we just bulk_created, we might need to be careful with IDs in some DBs.
        # For SQLite, bulk_create usually sets IDs if supported, but let's re-fetch to be safe.

        # Re-fetch to ensure we have all instances with their database state
        final_wds = WorkDay.objects.filter(
            device=device,
            date__in=list(all_dates),
            employee__attendance_id__in=attendance_ids
        )

        count = 0
        for wd in final_wds:
            wd.update_totals(save=False)
            count += 1

        if count > 0:
            WorkDay.objects.bulk_update(
                final_wds,
                ['late_seconds', 'work_hours', 'overwork_hours', 'out_return_hours']
            )

        print(f"Updated totals for {count} workdays.")
    return days


def sync_all(device):
    from Attendance.zkt import sync_attendance, sync_users
    # 1. Sync employee list from device
    sync_users(device)
    # 2. Sync raw attendance logs
    records, ts = sync_attendance(device)
    # 3. Process records into analyzed WorkDay objects
    if records:
        sync_records(device, records=records)


def sync_all_devices():
    from Attendance.models import ZKTDevice
    for device in ZKTDevice.objects.all():
        print(f"--- Starting Sync for Device: {device.name} ({device.ip}) ---")
        try:
            sync_all(device)
        except Exception as e:
            print(f"ERROR: Failed to sync device {device.name}: {e}")


if __name__ == '__main__':
    # Initialize Django environment for standalone script execution
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "HTI.settings")
    django.setup()
    sync_all_devices()
