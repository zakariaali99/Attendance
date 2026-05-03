# Integrated ZKTeco Biometric Device Library
# Uses the 'pyzk' library for connection and data retrieval
import sys
from datetime import datetime
from dateutil.tz import UTC
from django.utils import timezone
from zk import ZK
from Attendance.models import Record, Employee, ZKTDevice
from zk.attendance import Attendance as Att, Attendance


def sync_attendance(device):
    """
    Connects to a biometric device, pulls raw attendance records, 
    and checks against the last synced record to avoid duplicates.
    Results are saved into the Record model via bulk_create.
    """
    records = []
    ts = []
    zk = ZK(device.ip, device.port)
    conn = None
    try:
        conn = zk.connect()
        data = conn.get_attendance()
        last = Record.objects.filter(device=device).order_by('timestamp').last()

        for index, i in enumerate(data):
            if last is not None:
                # timezone.make_aware is usually safer if we knew device's local timezone
                # but we'll stick to replacing it with UTC for now to maintain consistency
                if i.timestamp.replace(tzinfo=None) > last.timestamp.replace(tzinfo=None):
                    r = Record(
                        user_id=i.user_id, 
                        timestamp=i.timestamp.replace(tzinfo=UTC), 
                        status=i.status, 
                        uid=i.uid,
                        device=device
                    )
                    records.append(r)
                    ts.append(i.timestamp)
            else:
                r = Record(
                    user_id=i.user_id, 
                    timestamp=i.timestamp.replace(tzinfo=UTC), 
                    status=i.status, 
                    uid=i.uid,
                    device=device
                )
                records.append(r)
                ts.append(i.timestamp)
        
        Record.objects.bulk_create(records, batch_size=100)
    finally:
        if conn:
            conn.disconnect()
            
    return records, ts


def sync_missed(device):
    """
    Checks the device for all attendance records and finds any 
    that were missed in the database compared to the device.
    """
    print(f"Connecting to device {device.ip} to check for missed records...")
    zk = ZK(device.ip, device.port)
    conn = None
    try:
        conn = zk.connect()
        data = conn.get_attendance()
        print("Successfully retrieved device records")
    finally:
        if conn:
            conn.disconnect()
            print("Device disconnected.")

    # Efficient search using standard Python sets (replaces numpy)
    existing_ts_set = {r.timestamp for r in Record.objects.filter(device=device)}
    
    data_records = [
        Record(
            user_id=i.user_id, 
            timestamp=i.timestamp.replace(tzinfo=UTC), 
            status=i.status, 
            uid=i.uid,
            device=device
        ) for i in data
    ]
    
    missed = [r for r in data_records if r.timestamp not in existing_ts_set]

    print(f"Found {len(missed)} missed records.")
    return missed


def sync_users(device):
    """
    Synchronizes users (employees) from the device to the database.
    Only adds new users that don't already exist by attendance ID.
    """
    zk = ZK(device.ip, device.port)
    conn = None
    try:
        conn = zk.connect()
        data = conn.get_users()
        emp_ids = set(Employee.objects.all().values_list('attendance_id', flat=True))
        
        new_users = [
            Employee(attendance_id=i.user_id, name=i.name, device=device) 
            for i in data if i.user_id not in emp_ids
        ]
        
        if new_users:
            Employee.objects.bulk_create(new_users)
            print(f"Successfully added {len(new_users)} new employees from device.")
        return new_users
    finally:
        if conn:
            conn.disconnect()


def get_users_templates(host: str, port=4370):
    zk = ZK(host, port)
    conn = None
    try:
        conn = zk.connect()
        data = conn.get_templates()
        return data
    finally:
        if conn:
            conn.disconnect()


def get_users(host: str, port=4370):
    zk = ZK(host, port)
    conn = None
    try:
        conn = zk.connect()
        # This part seems tailored for a specific manual operation
        # user_template = conn.get_user_template(uid=27, temp_id=0)
        data = conn.get_users()
        return data
    finally:
        if conn:
            conn.disconnect()
