import os
import django
import datetime
from django.test import Client
from VIPAlert.models import User

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'HTI.settings')
django.setup()

c = Client()
user = User.objects.first()
c.force_login(user)

try:
    print("Testing /report/payroll-summary with default dates...")
    response = c.get('/report/payroll-summary')
    print("Status code:", response.status_code)
    if response.status_code == 500:
        # Django test client doesn't always show the full traceback in response.content if DEBUG=False
        # But since we are running in shell, we might get more info if we trigger the view manually
        pass
except Exception as e:
    import traceback
    traceback.print_exc()

# Manually trigger the view logic to see the error
from Attendance.views import ExportPayrollSummaryView
from django.test import RequestFactory

factory = RequestFactory()
request = factory.get('/report/payroll-summary')
request.user = user
view = ExportPayrollSummaryView.as_view()

try:
    view(request)
except Exception as e:
    import traceback
    traceback.print_exc()

