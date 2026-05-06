import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "VIPAlert.settings")
django.setup()
from Attendance.models import Employee
e = Employee.objects.first()
if e:
    print(dir(e))
    try:
        print(e.exception_set.all())
    except Exception as ex:
        print("ERROR:", ex)
