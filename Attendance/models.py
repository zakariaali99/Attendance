import datetime
from django.db import models
from django.db.models import Q
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Day(models.Model):
    days = [
        (0, "السبت"),
        (1, "الأحد"),
        (2, "الاثنين"),
        (3, "الثلاثاء"),
        (4, "الأربعاء"),
        (5, "الخميس"),
        (6, "الجمعة"),
    ]
    id = models.AutoField(primary_key=True)
    day = models.CharField(max_length=2, choices=days)

    @property
    def name(self):
        for o, d in self.days:
            if self.day == str(o):
                return d
        return ""

    def __str__(self):
        return self.name


class Profile(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=4096)
    full_month_work = models.BooleanField(default=False, help_text="If True, every day is a work day.")
    start_time = models.TimeField(null=True, default=None)
    end_time = models.TimeField(null=True, default=None)
    allowed_start_time = models.TimeField(null=True, default=None)
    calculate_start_time = models.TimeField(null=True, default=None)
    allowed_end_time = models.TimeField(null=True, default=None)
    calculate_end_time = models.TimeField(null=True, default=None)
    next_day = models.BooleanField(default=False)
    extra = models.BooleanField(default=False)
    hourly = models.BooleanField(default=False)

    auto_open = models.BooleanField(default=False)
    auto_close = models.BooleanField(default=False)

    days = models.ManyToManyField('Day')

    shift_start_time = models.TimeField(null=True, default=None)
    shift_end_time = models.TimeField(null=True, default=None)
    shift_end_next_day = models.BooleanField(default=False)
    by_finger_print_count = models.BooleanField(default=True)
    late_threshold = models.IntegerField(default=15, help_text="Number of minutes after start_time to consider the employee late.")

    def is_working_day(self, date_obj):
        if self.full_month_work:
            return True
        # Python: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
        # Our Day model: 0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri
        python_to_our_day = {0: '2', 1: '3', 2: '4', 3: '5', 4: '6', 5: '0', 6: '1'}
        our_day_val = python_to_our_day[date_obj.weekday()]
        return self.days.filter(day=our_day_val).exists()

    def is_weekend(self, date_obj):
        return not self.is_working_day(date_obj)

    def __str__(self):
        return self.name

    class Meta:
        permissions = [
            ("can_view_profiles", "View Profiles"),
            ("can_create_profiles", "Add profile"),
            ("can_delete_profiles", "Delete profiles"),
            ("can_edit_profiles", "Edit profiles"),
        ]


class Employee(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=4096, blank=True, null=True)
    phone = models.CharField(max_length=4096, blank=True, default="")
    attendance_id = models.CharField(max_length=256)
    device = models.ForeignKey("ZKTDevice", on_delete=models.SET_NULL, null=True, default=None)
    default_profile = models.ForeignKey("Profile", on_delete=models.SET_NULL, null=True)
    active = models.BooleanField(default=False)
    current_vacations = models.FloatField(_("Current vacations"), default=0)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.work_time = None
        self.overwork_time = None
        self.out_return_time = None
        self.res = None
        self.workdays = None
        self.holidays = None

    class Meta:
        ordering = ("id",)
        permissions = [
            ("can_view_employees", "View employees"),
            ("can_view_employee_records", "View employee records"),
            ("can_create_employees", "Add employees"),
            ("can_delete_employees", "Delete employees"),
            ("can_edit_employees", "Edit employees"),
            ("can_edit_employees_records", "Edit employees records"),
            ("can_edit_export_report", "Edit employees records"),
        ]

    def __str__(self):
        return self.name or self.attendance_id

    @property
    def records(self):
        if self.res is None:
            self.res = Record.objects.filter(user_id=self.attendance_id).select_related()
        return self.res

    def set_records(self, records):
        self.res = [r for r in records if r.user_id == self.attendance_id]

    def set_workdays(self, wds):
        self.workdays = [r for r in wds if r.employee_id == self.id]
        if self.res is not None:
            _ = [wd.set_records(self.res) for wd in self.workdays]

    @property
    def all_days(self):
        if self.workdays is not None:
            return self.workdays
        return WorkDay.objects.filter(employee=self)

    @property
    def all_days_count(self):
        return len(self.all_days)

    @property
    def holidays_count(self):
        profile = self.default_profile or Profile.objects.first()
        # Filter out weekends based on profile, then count holidays
        excluded_days = filter(lambda a: not a.is_weekend(profile), self.all_days)
        return len(list(filter(lambda a: a.is_holiday, excluded_days)))

    @property
    def late_days(self):
        return list(filter(lambda a: a.late > 0, self.all_days))

    @property
    def late_days_count(self):
        if self.workdays is not None:
            return len([day for day in self.workdays if day.late_seconds > 0])
        return WorkDay.objects.filter(employee=self, late_seconds__gt=0).count()

    @property
    def vacations_count(self):
        c = 0
        for v in self.vacation_set.all():
            if v.date and v.to_date:
                c += (v.to_date - v.date).days + 1
        return c

    @property
    def extra_work(self):
        extrawork = self.extrawork_set.all()
        return sum(e.time() for e in extrawork)

    def days(self, from_date=None, to_date=None):
        wd = self.all_days  # WorkDay.objects.filter(employee=self)

        wd = filter(lambda a: len(a.shifts()) > 0, wd)
        if from_date:
            if not isinstance(from_date, datetime.date):
                from_date = datetime.datetime.strptime(from_date, "%Y-%m-%d")
            # from_date.date()
            wd = filter(lambda a: a.date >= from_date.date(), wd)
            # wd = wd.filter(date__gte=from_date)
        if to_date:
            if not isinstance(to_date, datetime.date):
                to_date = datetime.datetime.strptime(to_date, "%Y-%m-%d")
            wd = filter(lambda a: a.date <= to_date.date(), wd)

        return wd

    @property
    def count_hours(self):
        if self.workdays is not None:
            work_time = sum(d.work for d in self.workdays)
            overwork_time = sum(d.overwork for d in self.workdays)
            out_return_time = sum(d.out_return_time for d in self.workdays)
        else:
            from django.db.models import Sum
            totals = WorkDay.objects.filter(employee=self).aggregate(
                total_work=Sum('work_hours'),
                total_overwork=Sum('overwork_hours'),
                total_out=Sum('out_return_hours')
            )
            work_time = totals['total_work'] or 0
            overwork_time = totals['total_overwork'] or 0
            out_return_time = totals['total_out'] or 0

        ndigits = 2
        self.overwork_time = round(overwork_time, ndigits)
        self.work_time = round(work_time, ndigits)
        self.out_return_time = round(out_return_time, ndigits)
        return self.work_time

    @property
    def count_overwork(self):
        if self.overwork_time is None:
            self.count_hours
        return self.overwork_time

    @property
    def count_out(self):
        if self.out_return_time is None:
            self.count_hours
        return self.out_return_time

    @property
    def out_return_count(self):
        if self.workdays is not None:
            return len([day for day in self.workdays if day.out_return_time > 0])
        return WorkDay.objects.filter(employee=self, out_return_hours__gt=0).count()


attendance_choices = [
    ("early_exit", "خروج مبكر"),
    ("late", "تأخير"),
    ("attendance", "حضور"),
]


class Record(models.Model):
    id = models.AutoField(primary_key=True)
    user_id = models.CharField(max_length=4096, db_index=True)
    timestamp = models.DateTimeField(default=None, null=True, db_index=True)
    punch = models.CharField(max_length=256)
    uid = models.CharField(max_length=1024, default="", blank=True)
    device = models.ForeignKey("Attendance.ZKTDevice", on_delete=models.SET_NULL, null=True)
    status = models.CharField(choices=attendance_choices, default="attendance", null=True, max_length=50)
    note = models.TextField(default="", blank=True)


    def __str__(self):
        return f"{self.user_id} -> {self.timestamp}, {self.id}, {self.status}"


class ZKTDevice(models.Model):
    id = models.AutoField(primary_key=True)
    ip = models.CharField(max_length=4096)
    port = models.IntegerField(default=4370)
    name = models.CharField(max_length=4096, blank=True, default="")
    out_during_work = models.BooleanField(default=False)

    def __str__(self):
        if self.name.__len__() <= 0:
            return self.ip

        return self.name


class Shift:
    start = None
    end = None
    start_percent = None
    end_percent = None
    profile = None
    theme = None
    type = "work"
    automatic_close = False
    automatic_open = False

    def name(self):
        start = "No Finger"
        if self.start is not None:
            start = self.start.strftime('%Y-%m-%d %H:%M')
        end = "No Finger"
        if self.end is not None:
            end = self.end.strftime('%Y-%m-%d %H:%M')
        return f"{start} -> {end}"

    @property
    def width_percent(self):
        stime = self.start.replace(tzinfo=None)
        etime = self.end.replace(tzinfo=None)
        profile = self.profile
        if profile is None:
            profile = Profile.objects.first()
        eh, em = profile.shift_end_time.hour, profile.shift_end_time.minute
        sh, sm = profile.shift_start_time.hour, profile.shift_start_time.minute
        total_time = (datetime.datetime(2021, 1, 1, eh, em) - datetime.datetime(2021, 1, 1, sh, sm)).seconds
        diff = etime - stime
        return int((diff.seconds / total_time) * 100)

    @property
    def seconds(self):
        if self.end is None or self.start is None:
            return 0
        return (self.end.replace(tzinfo=None) - self.start.replace(tzinfo=None)).seconds

    @property
    def late(self):
        if self.start is None or self.end is None:
            return 0
        etime = self.profile.calculate_start_time.replace(tzinfo=None)
        time = datetime.datetime(self.start.year, self.start.month, self.start.day, etime.hour, etime.minute)

        if self.start.replace(tzinfo=None) <= time:
            return 0
        m = (self.start.replace(tzinfo=None) - time).seconds

        return m

    @property
    def early(self):
        # m=(self.profile.end_time.replace(tzinfo=None) - self.end.replace(tzinfo=None)).seconds
        # if m < 0:
        return 0

    # return m

    @property
    def style(self):
        if self.automatic_open:
            return "border border-danger progress-bar-striped bg-warning"
        if self.automatic_close:
            return "border border-danger progress-bar-striped bg-info"
        return self.theme


class Holiday(models.Model):
    date = models.DateField(null=True, default=None)
    employee = models.ForeignKey('Employee', on_delete=models.CASCADE, related_name='holiday_set')


class VacationType(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=150)

    def __str__(self) -> str:
        return self.title


class Vacation(models.Model):
    date = models.DateField(null=True, default=None)
    to_date = models.DateField(null=True, default=None)
    employee = models.ForeignKey('Employee', on_delete=models.CASCADE)
    note = models.TextField()
    vacation_type = models.ForeignKey("VacationType", null=True, on_delete=models.SET_NULL)

    def __str__(self) -> str:
        name = self.employee.name or self.employee.attendance_id
        return f"{name} - [ {self.vacation_type.title} ] - [{self.date} > {self.to_date}]"

    @property
    def duration(self):
        if self.to_date and self.date:
            return (self.to_date - self.date).days + 1
        return 0


class ExceptionType(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=150)

    def __str__(self) -> str:
        return self.title


class AttendanceException(models.Model):

    types = [
        ("early_exit", "خروج مبكر"),
        ("late", "تأخير"),
    ]
    date = models.DateField(null=True, default=None)
    employee = models.ForeignKey('Employee', on_delete=models.CASCADE, related_name='exception_set')
    note = models.TextField()
    type = models.CharField(choices=types, default=None, null=True, max_length=50)

    def __str__(self) -> str:
        name = self.employee.name or self.employee.attendance_id
        return f"{name} - [ {self.type} ] - [{self.date}]"

    class Meta:
        db_table = 'Attendance_exception'


class ExtraWork(models.Model):
    start = models.DateTimeField(null=False, default=timezone.now)
    end = models.DateTimeField(null=True, default=timezone.now)
    employee = models.ForeignKey('Employee', on_delete=models.CASCADE, related_name='extrawork_set')
    note = models.TextField()

    def __str__(self) -> str:
        name = self.employee.name or self.employee.attendance_id
        return f"{name} - [{self.start} -> {self.end}]"

    def time(self):
        return (self.end - self.start).seconds


class WorkDay(models.Model):
    date = models.DateField(null=True, default=None, db_index=True)
    employee = models.ForeignKey('Employee', on_delete=models.CASCADE)
    device = models.ForeignKey('Attendance.ZKTDevice', on_delete=models.SET_NULL, default=1, null=True)
    _records = None
    worktime = None
    overworktime = None
    out_return_time = None

    # Cached totals for performance
    late_seconds = models.IntegerField(default=0)
    work_hours = models.FloatField(default=0)
    overwork_hours = models.FloatField(default=0)
    out_return_hours = models.FloatField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=['employee', 'date']),
        ]

    def update_totals(self):
        # Calculate and cache totals
        self.late_seconds = sum([s.late for s in self.shifts()])
        self.work_hours = self.calculate("work")
        self.overwork_hours = self.calculate("overwork")
        self.out_return_hours = self.calculate("out")
        self.save(update_fields=['late_seconds', 'work_hours', 'overwork_hours', 'out_return_hours'])

    def setdate(self, t):
        self.date = t

    def set_records(self, t):
        self._records = t

    def is_weekend(self, profile=None):
        if not profile:
            profile = self.employee.default_profile or Profile.objects.first()
        if not profile:
            return self.date.weekday() in (4, 5) # Fallback to Fri/Sat
        return profile.is_weekend(self.date)

    @property
    def is_friday(self):
        return self.date.weekday() == 4

    @property
    def is_saturday(self):
        return self.date.weekday() == 5

    @property
    def is_holiday(self):
        return self.employee.holiday_set.filter(date=self.date).exists()

    @property
    def late(self):
        if self.late_seconds > 0:
            return self.late_seconds
        return sum([s.late for s in self.shifts()])

    @property
    def late_min(self):
        return self.late / 60

    @property
    def work_day_exceptions(self):
        return [e for e in self.employee.exception_set.all() if e.date == self.date]

    def records(self):
        if self._records is None:
            # Use a more efficient range query to utilize database indexes
            from datetime import datetime, time
            start = datetime.combine(self.date, time.min)
            end = datetime.combine(self.date, time.max)
            self._records = Record.objects.filter(
                timestamp__range=(start, end),
                user_id=self.employee.attendance_id
            ).order_by("timestamp")
        return self._records

    def prepare_shift(self, start_rc, end_rc, profile, is_in=False, automatic_close=False, automatic_open=False):
        worktime = 0
        overworktime = 0
        s = Shift()
        s.profile = profile
        if start_rc is not None:
            s.start = start_rc.timestamp
        # if end_rc.timestamp.date() == s.start.date():
        if end_rc is not None:
            s.end = end_rc.timestamp

        if start_rc is None:
            ts = end_rc.timestamp
            device = end_rc.device
        else:
            ts = start_rc.timestamp
            device = start_rc.device
        end = profile.end_time
        start = profile.start_time

        d, y, m, mn, h = ts.day, ts.year, ts.month, end.minute, end.hour
        next_day = 0
        if profile.next_day:
            next_day = 1
        smn, sh = start.minute, start.hour
        if is_in:
            if profile.hourly and (
                    s.start.replace(tzinfo=None) > datetime.datetime(y, m, d + next_day, h, mn).replace(tzinfo=None) or \
                    s.start.replace(tzinfo=None) < datetime.datetime(y, m, d, sh, smn).replace(tzinfo=None)):
                s.theme = "bg-dark"
                s.type = "overwork"
                overworktime += s.seconds
            else:
                s.theme = "bg-success"
                s.type = "work"
                worktime += s.seconds
        else:
            start = datetime.datetime(y, m, d, sh, smn).replace(tzinfo=None)
            end = datetime.datetime(y, m, d, h, mn).replace(tzinfo=None)
            if s.start.replace(tzinfo=None) > start and s.end.replace(tzinfo=None) < end:
                s.theme = "bg-danger"
                s.type = "out"
            else:
                # s.theme = "bg-secondary"
                s.theme = "bg-light"
                s.type = "unknown"
                # s.theme = "bg-warning"

        if device:
            if device.out_during_work:
                s.type = "out"
        s.automatic_close = automatic_close
        s.automatic_open = automatic_open
        return s, worktime, overworktime

    def shifts(self):
        worktime = 0
        overworktime = 0
        out_and_return = 0
        p = self.employee.default_profile
        if p is None:
            p = Profile.objects.first()

        if p is None:
            return []

        if p.by_finger_print_count:
            return self.by_finger_print_count()

        rs = self.records()

        rs = list(filter(lambda r: r.timestamp.date() == self.date, rs))

        rs.sort(key=lambda a: a.timestamp)
        shifts = []
        if len(rs) <= 0:
            return shifts

        ts = rs[0].timestamp
        d, y, m = ts.day, ts.year, ts.month

        smn, sh = p.start_time.minute, p.start_time.hour
        emn, eh = p.end_time.minute, p.end_time.hour
        mn, h = p.shift_start_time.minute, p.shift_start_time.hour
        start_profile_shift = Record(timestamp=datetime.datetime(y, m, d, sh, smn))
        end_profile_shift = Record(timestamp=datetime.datetime(y, m, d, eh, emn))
        start_shift = Record(timestamp=datetime.datetime(y, m, d, h, mn))

        if len(rs) == 1:
            s, w, ow = self._calculate_single_record_shift(rs[0], p, start_profile_shift, end_profile_shift, start_profile_shift.timestamp, end_profile_shift.timestamp)
            shifts.append(s)
            worktime += w
            overworktime += ow
            return shifts

        # if p.shift_start_time.minute < ts.minute:
        mn, h = p.shift_start_time.minute, p.shift_start_time.hour
        er = Record(timestamp=datetime.datetime(y, m, d, h, mn))
        s, w, ow = self.prepare_shift(er, rs[0], p, False)
        shifts.append(s)

        is_in = True

        for i in range(0, len(rs) - 1):
            if rs[i].timestamp.date() != self.date:
                continue

            s, w, ow = self.prepare_shift(rs[i], rs[i + 1], p, is_in)

            shifts.append(s)
            worktime += w
            overworktime += ow
            is_in = not is_in

        total = len(shifts)

        if is_in and total > 0:
            shift = shifts[total - 1]
            end = p.end_time
            ts = shift.end

            if ts is None:
                ts = shift.start
            d, y, m, mn, h = ts.day, ts.year, ts.month, end.minute, end.hour

            if shift.end is None:
                shift.end = datetime.datetime(y, m, d, h, mn).replace(tzinfo=None)

            if shift.end.replace(tzinfo=None) < datetime.datetime(y, m, d, h, mn).replace(tzinfo=None):
                er = Record(timestamp=datetime.datetime(y, m, d, h, mn))
                s, w, ow = self.prepare_shift(rs[-1], er, p, is_in)
                shifts.append(s)

            if is_in:
                s = Shift()
                s.profile = self.employee.default_profile
                s.start = shift.end
                s.end = datetime.datetime(y, m, d, 23, 59)
                s.theme = "bg-light"
                s.type = "unknown"

                shifts.append(s)
        self.worktime = worktime
        self.overworktime = overworktime
        return shifts

    def by_finger_print_count(self):
        worktime = 0
        overworktime = 0
        out_and_return = 0
        rs = self.records()
        p = self.employee.default_profile
        # rs = [r for r in rs if r.timestamp.date() == self.date]
        if p is None:
            p = Profile.objects.first()

        shift_next_day = 0
        next_day = 0
        if p.shift_end_next_day:
            shift_next_day = 1

        if p.next_day:
            next_day = 1

        start_date = datetime.datetime(self.date.year, self.date.month, self.date.day, p.shift_start_time.hour,
                                       p.shift_start_time.minute)
        start_date_working = datetime.datetime(self.date.year, self.date.month, self.date.day, p.start_time.hour,
                                               p.start_time.minute)

        end_date = datetime.datetime(self.date.year, self.date.month, self.date.day, p.shift_end_time.hour,
                                     p.shift_end_time.minute) + datetime.timedelta(days=shift_next_day)
        end_date_working = datetime.datetime(self.date.year, self.date.month, self.date.day, p.end_time.hour,
                                             p.end_time.minute) + datetime.timedelta(days=next_day)

        rs = list(filter(
            lambda r: r.timestamp.replace(tzinfo=None) >= start_date and r.timestamp.replace(tzinfo=None) <= end_date,
            rs))

        rs.sort(key=lambda a: a.timestamp)

        shifts = []
        if len(rs) == 1:
            s, w, ow = self._calculate_single_record_shift(rs[0], p, Record(timestamp=start_date), Record(timestamp=end_date), start_date_working, end_date_working)
            shifts.append(s)
            worktime += w
            overworktime += ow
            return shifts

        is_in = True
        for i in range(0, len(rs) - 1, 2):
            # if rs[i].timestamp.date() != self.date:
            # continue

            s, w, ow = self.prepare_shift(rs[i], rs[i + 1], p, is_in)

            shifts.append(s)
            worktime += w
            overworktime += ow
        return shifts

    def _calculate_single_record_shift(self, record, p, start_profile_shift, end_profile_shift, start_date_working, end_date_working):
        """Helper to calculate shift when only one record is present."""
        delta_start = record.timestamp.replace(tzinfo=None) - start_profile_shift.timestamp
        delta_end = end_profile_shift.timestamp - record.timestamp.replace(tzinfo=None)

        is_in = False
        worktime = 0
        overworktime = 0
        if delta_end > delta_start:
            is_in = True
            exceptions = list(filter(lambda a: a.type != "late", self.work_day_exceptions))
            end_time = None
            if p.auto_close or len(exceptions) > 0:
                end_time = Record(timestamp=end_date_working)
            s, w, ow = self.prepare_shift(record, end_time, p, is_in, p.auto_close)
            worktime = w
            overworktime = ow
        else:
            exceptions = list(filter(lambda a: a.type == "late", self.work_day_exceptions))
            start_time = None
            if p.auto_open or len(exceptions) > 0:
                start_time = Record(timestamp=start_date_working)
            s, w, ow = self.prepare_shift(start_time, record, p, not is_in, automatic_open=p.auto_open)
            worktime = w
            overworktime = ow
        return s, worktime, overworktime

    def calculate(self, work_type):
        t = 0
        for s in self.shifts():
            if s.type == work_type:
                t += s.seconds
        return round(t / 3600, 2)

    def late_and_early(self, work_type):
        t = 0
        for s in self.shifts():
            if s.type == work_type:
                t += s.seconds
        return round(t / 3600, 2)

    @property
    def overwork(self):
        if self.overwork_hours > 0:
            return self.overwork_hours
        return self.calculate("overwork")

    @property
    def work(self):
        if self.work_hours > 0:
            return self.work_hours
        return self.calculate("work")

    @property
    def out_return_time(self):
        if self.out_return_hours > 0:
            return self.out_return_hours
        return self.calculate("out")

    def get_formatted_date(self):

        return datetime.date.strftime(self.date, "%Y-%m-%d")
