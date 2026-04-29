import re

with open('/Users/zakaria/projects/antigravity/attendance/Attendance/models.py', 'r') as f:
    content = f.read()

# Define the full correct content of Profile and Employee classes
profile_class = """class Profile(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=4096)
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

    def __str__(self):
        return self.name

    class Meta:
        permissions = [
            ("can_view_profiles", "View Profiles"),
            ("can_create_profiles", "Add profile"),
            ("can_delete_profiles", "Delete profiles"),
            ("can_edit_profiles", "Edit profiles"),
        ]"""

employee_class_start = """class Employee(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=4096)
    phone = models.CharField(max_length=4096, blank=True, default="")
    attendance_id = models.CharField(max_length=256)
    device = models.ForeignKey("ZKTDevice", on_delete=models.SET_NULL, null=True, default=None)
    default_profile = models.ForeignKey("Profile", on_delete=models.SET_NULL, null=True)
    active = models.BooleanField(default=False)
    current_vacations = models.FloatField(_("Current vacations"), default=0)
    work_time = None
    overwork_time = None
    out_return_time = None
    res = None
    workdays = None
    holidays = None

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
        return self.name"""

attendance_choices = """attendance_choices = [
    ("early_exit", "خروج مبكر"),
    ("late", "تأخير"),
    ("attendance", "حضور"),
]"""

# Replace the messy parts
# Find from class Profile down to attendance_choices and replace with correct definitions
content = re.sub(r'class Profile\(models.Model\):.*?attendance_choices = \[.*?\]', 
                 profile_class + '\n\n\n' + employee_class_start + '\n\n    @property\n    def records(self):\n        if self.res is None:\n            self.res = Record.objects.filter(user_id=self.attendance_id).select_related()\n        return self.res\n\n    def set_records(self, records):\n        self.res = [r for r in records if r.user_id == self.attendance_id]\n\n    def set_workdays(self, wds):\n        self.workdays = [r for r in wds if r.employee_id == self.id]\n        if self.res is not None:\n            _ = [wd.set_records(self.res) for wd in self.workdays]\n\n    @property\n    def all_days(self):\n        if self.workdays is not None:\n            return self.workdays\n        return WorkDay.objects.filter(employee=self)\n\n    @property\n    def all_days_count(self):\n        return len(self.all_days)\n\n    @property\n    def holidays_count(self):\n        excluded_days = filter(lambda a: not a.is_friday and not a.is_saturday, self.all_days)\n        return len(list(filter(lambda a: a.is_holiday, excluded_days)))\n\n    @property\n    def late_days(self):\n        return list(filter(lambda a: a.late > 0, self.all_days))\n\n    @property\n    def late_days_count(self):\n        return len(self.late_days)\n\n    @property\n    def vacations_count(self):\n        c = 0\n        for v in self.vacation_set.all():\n            if v.date and v.to_date:\n                c += (v.to_date - v.date).days + 1\n        return c\n\n    @property\n    def extra_work(self):\n        extrawork = self.extrawork_set.all()\n        return sum(e.time() for e in extrawork)\n\n    def days(self, from_date=None, to_date=None):\n        wd = self.all_days\n        wd = filter(lambda a: len(a.shifts()) > 0, wd)\n        if from_date:\n            if not isinstance(from_date, datetime.date):\n                from_date = datetime.datetime.strptime(from_date, "%Y-%m-%d")\n            wd = filter(lambda a: a.date >= from_date.date(), wd)\n        if to_date:\n            if not isinstance(to_date, datetime.date):\n                to_date = datetime.datetime.strptime(to_date, "%Y-%m-%d")\n            wd = filter(lambda a: a.date <= to_date.date(), wd)\n        return wd\n\n    @property\n    def count_hours(self):\n        work_time = 0\n        overwork_time = 0\n        out_return_time = 0\n        for d in self.all_days:\n            work_time += d.work\n            overwork_time += d.overwork\n            out_return_time += d.out_return_time\n        ndigits = 2\n        self.overwork_time = round(overwork_time, ndigits)\n        self.work_time = round(work_time, ndigits)\n        self.out_return_time = round(out_return_time, ndigits)\n        return self.work_time\n\n    @property\n    def count_overwork(self): \n        if self.overwork_time is None: self.count_hours()\n        return self.overwork_time\n\n    @property\n    def count_out(self): \n        if self.out_return_time is None: self.count_hours()\n        return self.out_return_time\n\n    @property\n    def out_return_count(self): \n        return len([day for day in self.all_days if day.out_return_time > 0])\n\n\n' + attendance_choices, 
                 content, flags=re.DOTALL)

with open('/Users/zakaria/projects/antigravity/attendance/Attendance/models.py', 'w') as f:
    f.write(content)
