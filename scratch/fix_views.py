import re

with open('/Users/zakaria/projects/antigravity/attendance/Attendance/views.py', 'r') as f:
    content = f.read()

# Fix AddEmployeeView (already there but might have duplicates)
# Actually, I'll just rewrite the whole section from class AddEmployeeView to class SyncDevicesView
# And class EditEmployeeView to class EmployeeView
# And class AddVacationsView to class AddVacationTypeView

# Let's use regex to find and replace the classes properly

classes_to_fix = {
    r'class AddEmployeeView.*?class SyncDevicesView': """class AddEmployeeView(PermissionRequiredMixin, CreateView):
    template_name = "attendance/add_edit_employee.html"
    form_class = EmployeeForm
    model = Employee
    success_url = reverse_lazy("Attendance:list")
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True

    def form_valid(self, form):
        response = super().form_valid(form)
        SystemLog.objects.create(
            user=self.request.user,
            action="إضافة موظف",
            description=f"تم إضافة موظف جديد: {self.object.name}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return response

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class SyncDevicesView""",

    r'class EditEmployeeView.*?class EmployeeView': """class EditEmployeeView(PermissionRequiredMixin, UpdateView):
    template_name = "attendance/add_edit_employee.html"
    form_class = EmployeeForm
    model = Employee
    success_url = reverse_lazy("Attendance:list")
    permission_required = ('Attendance.can_edit_employees',)
    raise_exception = True

    def form_valid(self, form):
        response = super().form_valid(form)
        SystemLog.objects.create(
            user=self.request.user,
            action="تعديل موظف",
            description=f"تم تعديل بيانات الموظف: {self.object.name}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return response

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class EmployeeView""",

    r'class AddVacationsView.*?class AddVacationTypeView': """class AddVacationsView(PermissionRequiredMixin, FormView):
    template_name = "attendance/vacations/add_edit_vacation.html"
    form_class = AddVacationForm
    model = Vacation
    success_url = reverse_lazy("Attendance:vacation")
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def form_valid(self, form):
        for e in form.data.getlist("employees"):
            v = Vacation(date=form.data["date"],
                         to_date=form.data["to_date"],
                         note=form.data["note"],
                         vacation_type_id=form.data["type"],
                         employee_id=e
                         )
            v.save()
            v = Vacation.objects.get(id=v.id)
            employee = Employee.objects.get(id=e)
            employee.current_vacations = employee.current_vacations - (v.to_date - v.date).days
            employee.save()
        
        SystemLog.objects.create(
            user=self.request.user,
            action="إضافة إجازات",
            description=f"تم إضافة إجازات لعدد {len(form.data.getlist('employees'))} موظف",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return super().form_valid(form)


class AddVacationTypeView""",

    r'class AddExceptionsView.*?class DeleteExceptionView': """class AddExceptionsView(PermissionRequiredMixin, FormView):
    template_name = "attendance/exceptions/add_edit_exception.html"
    form_class = AddExceptionForm
    model = Exception
    success_url = reverse_lazy("Attendance:exception")
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def form_valid(self, form):
        for e in form.data.getlist("employees"):
            Exception(date=form.data["date"],
                      note=form.data["note"],
                      type=form.data["type"],
                      employee_id=e
                      ).save()
        
        SystemLog.objects.create(
            user=self.request.user,
            action="إضافة أذونات",
            description=f"تم إضافة أذونات لعدد {len(form.data.getlist('employees'))} موظف",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return super().form_valid(form)


class DeleteExceptionView"""
}

# Also clean up the orphan code I left in the middle of the file (lines 623-626 approx)
# It's currently:
# 622: 
# 623:             employee = Employee.objects.get(id=e)
# 624:             employee.current_vacations = employee.current_vacations - (v.to_date - v.date).days
# 625:             employee.save()
# 626:         return super().form_valid(form)

content = re.sub(r'def get\(self, request, \*args, \*\*kwargs\):\n\n        return super\(\).get\(request, \*args, \*\*kwargs\)\n\n            employee = Employee.objects.get\(id=e\)\n            employee.current_vacations = employee.current_vacations - \(v.to_date - v.date\).days\n            employee.save\(\)\n        return super\(\).form_valid\(form\)', '', content)

for pattern, replacement in classes_to_fix.items():
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('/Users/zakaria/projects/antigravity/attendance/Attendance/views.py', 'w') as f:
    f.write(content)
