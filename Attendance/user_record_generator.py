"""
Record Generator for Testing Purposes

This script generates random attendance records for testing.
DO NOT RUN IN PRODUCTION.

Usage: python manage.py shell < Attendance/user_record_generator.py
"""
import datetime
from random import randint

from django.utils import timezone
from Attendance.models import Employee, Record, Profile


def generate_test_records(month=7, year=2021, day_start=1, day_end=28):
    """Generate random test attendance records for all employees."""
    profile = Profile.objects.first()
    if not profile or not profile.start_time or not profile.end_time:
        print("ERROR: No valid profile with start_time/end_time found.")
        return

    records_created = 0
    for employee in Employee.objects.all():
        for day in range(day_start, day_end + 1):
            try:
                date = datetime.date(year, month, day)
                # Entry record
                entry_minute = randint(0, 59)
                entry_time = datetime.datetime(
                    year, month, day,
                    profile.start_time.hour,
                    entry_minute,
                    tzinfo=timezone.get_current_timezone()
                )
                Record.objects.create(
                    user_id=employee.attendance_id,
                    timestamp=entry_time,
                    punch="AUTO_GEN_ENTRY"
                )

                # Exit record
                exit_minute = randint(0, 59)
                exit_time = datetime.datetime(
                    year, month, day,
                    profile.end_time.hour,
                    exit_minute,
                    tzinfo=timezone.get_current_timezone()
                )
                Record.objects.create(
                    user_id=employee.attendance_id,
                    timestamp=exit_time,
                    punch="AUTO_GEN_EXIT"
                )
                records_created += 2
            except ValueError:
                # Skip invalid dates (e.g., day 31 in a 30-day month)
                continue

    print(f"Successfully created {records_created} test records.")


if __name__ == "__main__":
    print("WARNING: This script is for testing only.")
    print("Run it via: python manage.py shell < Attendance/user_record_generator.py")
