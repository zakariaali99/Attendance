from celery import shared_task
from Attendance.sync_records import sync_all_devices

@shared_task
def sync_all_devices_task():
    try:
        sync_all_devices()
        return "Sync completed successfully"
    except Exception as e:
        return f"Sync failed: {e}"

@shared_task
def send_monthly_report_task():
    # Placeholder for the automated email report logic
    print("Generating and sending monthly report via email...")
    return "Report sent successfully"
