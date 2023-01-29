import datetime
from datetime import time
from random import randint

from Attendance.models import Employee, Profile, Record

p = Profile.objects.first()

for e in Employee.objects.all():
    for i in range(1,29):
        r = Record()
        r.user_id = e.attendance_id
        rm = randint(15, 59)
        d = datetime.datetime(2021, 7, i, p.start_time.hour, rm)
        # t = time(p.start_time.hour, rm)
        r.timestamp = d.__str__()
        r.save()

        r = Record()
        r.user_id = e.attendance_id
        rm = randint(0, 59)
        d = datetime.datetime(2021, 7, i, p.end_time.hour, rm)
        r.timestamp = d.__str__()
        r.save()
