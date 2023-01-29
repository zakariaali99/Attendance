# https://github.com/fananimi/pyzk
import calendar
import sys
from datetime import datetime

from dateutil.tz import UTC
from django.utils import timezone
from zk import ZK
from Attendance.models import Record, Employee, ZKTDevice
# from src.employee import Employee
# from src.zklib import zklib
# import time
# from src.zklib import zkconst
# from Attendance.employee import Employee
from zk.attendance import Attendance as Att, Attendance
import pandas as pd
import numpy as np


#
# records = []
#
# host, port = "192.168.100.201", 4370
# zk = ZK(host, port)
# conn = zk.connect()
# data = conn.get_attendance()
#
# fingers = conn.fingers
# faces = conn.faces
# temps = conn.get_templates()
# last = Record.objects.last()  # order_by("timestamp").last()
#
# for i in data:
#     records.append([i.user_id, i.timestamp, i.status, i.punch, i.uid])
#
# records.sort(key=lambda a: a[1])
# timestamp = records.index(last.timestamp)
#
# Record.objects.bulk_create([
#     Record(user_id=i.user_id, timestamp=i.timestamp, status=i.status, punch=i.punch, uid=i.uid) for i in data
# ])
#
# users = conn.get_users()
# for user in users:
#     user.user_id
#
# # pd.DataFrame(records).to_csv("~/records_27_07_2021.csv", header=['user_id', 'timestamp', 'status', 'punch', 'uid'])
# d = data[0]
# # ahmed = Employee()
# # ahmed.filter(data)
# # days = ahmed.filter_per_day()
# # for k,v in days.items():
# #     print(k, v, "The value")
#
# # ahmed.work_days()
# # for i in ahmed.data:
# #     print(i, i.timestamp, type(i.timestamp))
# # if i.timestamp.year < 2100:
# # if i.user_id == '181' or i.uid == 181:
# #     print(i, i.uid)
# #     break
# # datetime.year < 2100
# print(type(d.timestamp))
# print(data.pop())
# print(conn.get_device_name())
# print(fingers, faces, len(data))
#
# conn.disconnect()


# conn.test_voice()
# zk = zklib.ZKLib(host, port)
# ret = zk.connect()
# print("connection:", ret)
# data = zk.getsAtt("192.168.100.201")
# print(data)

def sync_attendance(device):
    records = []
    ts = []
    zk = ZK(device.ip, device.port)
    conn = zk.connect()

    data = conn.get_attendance()
    last = Record.objects.filter(device=device).last()  # order_by("timestamp").last()
    # device = ZKTDevice.objects.filter(ip__exact=device.ip, device.port).first()

    for index, i in enumerate(data):
        if last is not None:
            if i.timestamp.replace(tzinfo=None) > last.timestamp.replace(tzinfo=None):
                r = Record(user_id=i.user_id, timestamp=i.timestamp.replace(tzinfo=UTC), status=i.status, uid=i.uid,
                           device=device)
                records.append(r)
                ts.append(i.timestamp)
        else:
            r = Record(user_id=i.user_id, timestamp=i.timestamp.replace(tzinfo=UTC), status=i.status, uid=i.uid,
                       device=device)
            records.append(r)
            ts.append(i.timestamp)
    # records.sort(key=lambda a: a[1])
    ts = [i.timestamp for i in records]
    # print(ts)
    # timestamp = ts.index(last.timestamp)
    # print(timestamp)
    conn.disconnect()
    Record.objects.bulk_create(records, batch_size=100)
    return records, ts


def sync_missed(device):
    records = []
    ts = []
    print("Connecting to device", device.ip)
    zk = ZK(device.ip, device.port)
    conn = zk.connect()
    print("Connected successfuly")
    print("Getting records")
    data = conn.get_attendance()
    print("Success Getting records ")
    print("Desconnecting from device")
    conn.disconnect()
    print("Device disconnected successfully")
    records = list(Record.objects.all()) 
    
    data_records = [Record(user_id=i.user_id, timestamp=i.timestamp.replace(tzinfo=UTC), status=i.status, uid=i.uid,
                       device=device) for i in data]
    records_ts = np.array([r.timestamp for r in records])
    
    ed = [ np.isin(records_ts,r.timestamp) for r in data_records]
    ed1 = [not any(e) for e in ed]
    missed = np.array(data_records)[ed1]
    
    print(len(missed))
    return missed
    # Record.objects.bulk_create(missed)

def sync_users(device):
    users = []
    zk = ZK(device.ip, device.port)
    conn = zk.connect()
    data = conn.get_users()
    emp = list(Employee.objects.all())#filter(device=device))
    emp_ids = [i.attendance_id for i in emp]

    # last = Record.objects.last()  # order_by("timestamp").last()
    #
    users = [Employee(attendance_id=i.user_id, name=i.name, device=device) for i in data if i.user_id not in emp_ids]
    # for i in data:
    #     if i.user_id not in emp_ids:
    #         e = Employee(attendance_id=i.user_id, name=i.name)
    #         users.append(e)  # [i.user_id, i.name, i.encoding])
    #
    # users.sort(key=lambda a: a[1])
    # timestamp = users.index(last.timestamp)

    conn.disconnect()
    Employee.objects.bulk_create(users)
    return users


def get_users_templates(host: str, port=4370):
    users = []
    zk = ZK(host, port)
    conn = zk.connect()
    data = conn.get_templates()
    conn.disconnect()
    return data


def get_users(host: str, port=4370):
    users = []
    zk = ZK(host, port)
    conn = zk.connect()
    users = conn.get_user_template(uid=27, temp_id=0)
    conn.save_user_template()
    data = conn.get_users()
    conn.disconnect()
    return data, users


def sync_records_devices(src: ZKTDevice, dist: ZKTDevice):
    tempalates = get_users_templates()
