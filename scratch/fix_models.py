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

# Replace the messy parts
content = re.sub(r'class Profile\(models.Model\):.*?class Employee\(models.Model\):', profile_class + '\n\n\nclass Employee(models.Model):', content, flags=re.DOTALL)
content = re.sub(r'class Employee\(models.Model\):.*?@property', employee_class_start + '\n\n    @property', content, flags=re.DOTALL)

# Ensure attendance_choices is correct
attendance_choices = """attendance_choices = [
    ("early_exit", "خروج مبكر"),
    ("late", "تأخير"),
    ("attendance", "حضور"),
]"""
content = re.sub(r'attendance_choices = \[.*?\]', attendance_choices, content, flags=re.DOTALL)

with open('/Users/zakaria/projects/antigravity/attendance/Attendance/models.py', 'w') as f:
    f.write(content)
