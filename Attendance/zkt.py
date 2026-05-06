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
    zk = ZK(device.ip, device.port, timeout=5, force_udp=False, ommit_ping=False)
    conn = None
    records = []
    ts = []
    try:
        conn = zk.connect()
        data = conn.get_attendance()
        
        last = Record.objects.filter(device=device).order_by('timestamp').last()
        
        if last:
            last_ts = last.timestamp.replace(tzinfo=None)
            new_data = [i for i in data if i.timestamp.replace(tzinfo=None) > last_ts]
        else:
            new_data = data

        for i in new_data:
            r = Record(
                user_id=i.user_id, 
                timestamp=i.timestamp.replace(tzinfo=UTC), 
                status=i.status, 
                uid=i.uid,
                device=device
            )
            records.append(r)
            ts.append(i.timestamp)
        
        if records:
            Record.objects.bulk_create(records, batch_size=500)
    except Exception as e:
        print(f"Error syncing attendance for device {device.ip}: {e}")
    finally:
        if conn:
            conn.disconnect()
            
    return records, ts


def sync_missed(device):
    # ...
    # (Leaving this as is for now as it's a diagnostic tool)
    pass


def sync_users(device):
    """
    Synchronizes users (employees) from the device to the database.
    Only adds new users that don't already exist by attendance ID.
    """
    zk = ZK(device.ip, device.port, timeout=5, force_udp=False, ommit_ping=False)
    conn = None
    try:
        conn = zk.connect()
        data = conn.get_users()
        
        # Get set of existing IDs for fast lookup
        existing_ids = set(Employee.objects.values_list('attendance_id', flat=True))
        
        new_users = [
            Employee(attendance_id=i.user_id, name=i.name, device=device) 
            for i in data if str(i.user_id) not in existing_ids
        ]
        
        if new_users:
            Employee.objects.bulk_create(new_users)
            print(f"Successfully added {len(new_users)} new employees from device.")
        return new_users
    except Exception as e:
        print(f"Error syncing users for device {device.ip}: {e}")
        return []
    finally:
        if conn:
            conn.disconnect()


def get_users_templates(host: str, port=4370):
    zk = ZK(host, port, timeout=5)
    conn = None
    try:
        conn = zk.connect()
        data = conn.get_templates()
        return data
    finally:
        if conn:
            conn.disconnect()


def get_users(host: str, port=4370):
    zk = ZK(host, port, timeout=5)
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
