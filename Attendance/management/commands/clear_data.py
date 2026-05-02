from django.core.management.base import BaseCommand
from Attendance.models import WorkDay, Record, Holiday, ExtraWork, Exception, Vacation, VacationType, Employee, Profile, Day, ZKTDevice

class Command(BaseCommand):
    help = 'Clears all data from the system except users and logs'

    def handle(self, *args, **options):
        # Models to delete in order to satisfy foreign key constraints
        models_to_delete = [
            WorkDay,
            Record,
            Holiday,
            ExtraWork,
            Exception,
            Vacation,
            VacationType,
            Employee,
            Profile,
            Day,
            ZKTDevice,
        ]

        for model in models_to_delete:
            count, _ = model.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f'Deleted {count} instances of {model.__name__}'))
            
        # Re-create the days
        for i, name in Day.days:
            Day.objects.create(id=i, day=str(i))
        self.stdout.write(self.style.SUCCESS('Re-created Day objects (0-6).'))
        
        self.stdout.write(self.style.SUCCESS('All specified data cleared successfully.'))
