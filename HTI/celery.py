import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'HTI.settings')

app = Celery('HTI')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

from celery.schedules import crontab

app.conf.beat_schedule = {
    'send-monthly-report-first-day': {
        'task': 'Attendance.tasks.send_monthly_report_task',
        # Executes every month on the 1st day at midnight (0:00)
        'schedule': crontab(day_of_month='1', hour=0, minute=0),
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
