import calendar
import os
import sys
from pathlib import Path

import django
from django.utils import timezone


def sync_records(device=None, records=None):
    from Attendance.models import Record, Employee, WorkDay, ZKTDevice

    # usrs = []
    days = dict()
    work_days = []
    this_year = timezone.now().year
    month = 12
    _, last_day_in_the_month = calendar.monthrange(this_year, month)
    workdays = WorkDay.objects.filter(device=device).order_by("-date").exclude(
        date__gt=f"{this_year}-{month}-{last_day_in_the_month}")
    workday = None
    if workdays.count() > 0:
        workday = workdays.first()

    if records is None:
        records = [r for r in Record.objects.all() if r.timestamp.date()]
    # print("Records from data", records)
    for r in records:
        if workday is not None:

            if r.timestamp.date() > workday.date:
                if r.user_id not in days.keys():
                    days[r.user_id] = [r.timestamp.date()]
                else:
                    if r.timestamp.date() not in days[r.user_id]:
                        days[r.user_id].append(r.timestamp.date())
        else:
            if r.user_id not in days.keys():
                days[r.user_id] = [r.timestamp.date()]
            else:
                if r.timestamp.date() not in days[r.user_id]:
                    days[r.user_id].append(r.timestamp.date())

    for k, v in days.items():
        try:
            e = Employee.objects.filter(attendance_id__iexact=k).first()
            for d in v:
                if d.year < this_year + 5:
                    try:
                        print(k, d, e.name)
                        w = WorkDay()
                        w.setdate(d)
                        w.employee = e
                        w.device = device
                        work_days.append(w)
                    except:
                        pass
                # w.save()
        except Employee.DoesNotExist:
            print(f"User dose not exist. {k}")
    WorkDay.objects.bulk_create(work_days)
    print("Work days added", len(work_days))
    return days


def sync_all(device):
    from Attendance.zkt import sync_attendance, sync_users
    # جهاز الخروج اثناء الدوام - 192.168.100.202:4370
    # الرئيسي - 192.168.100.201:4370
    sync_users(device)
    records, ts = sync_attendance(device)
    if records:
        sync_records(device, records=records)

def sync_all_devices():
    from Attendance.models import ZKTDevice, Record, WorkDay

    for device in ZKTDevice.objects.all():
        print(f"Syncing: {device.name} - {device.ip}:{device.port}")
        try:
            sync_all(device)
        except Exception as e:
            print(f"Failed to sync {device.name}: {e}")


if __name__ == '__main__':
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "HTI.settings")
    print('Python %s on %s' % (sys.version, sys.platform))
    print('Django %s' % django.get_version())
    BASE_DIR = Path(__file__).resolve().parent.parent
    sys.path.extend([f'{BASE_DIR}'])
    if 'setup' in dir(django):
        django.setup()
    sync_all_devices()
