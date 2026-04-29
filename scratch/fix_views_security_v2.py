import re

with open('/Users/zakaria/projects/antigravity/attendance/Attendance/views.py', 'r') as f:
    content = f.read()

# Add logging to EditVacationView
if 'def form_valid(self, form):' not in content[content.find('class EditVacationView'):content.find('class', content.find('class EditVacationView')+1)]:
    content = re.sub(
        r'class EditVacationView\(PermissionRequiredMixin, UpdateView\):.*?model = Vacation',
        '''class EditVacationView(PermissionRequiredMixin, UpdateView):
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True
    template_name = "attendance/vacations/edit_vacation.html"
    form_class = EditVacationForm
    model = Vacation
    success_url = reverse_lazy("Attendance:vacation")

    def form_valid(self, form):
        response = super().form_valid(form)
        SystemLog.objects.create(
            user=self.request.user,
            action="تعديل إجازة",
            description=f"تم تعديل إجازة الموظف: {self.object.employee.name}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return response''',
        content,
        flags=re.DOTALL
    )

# Add logging to AddVacationsView
if 'def form_valid(self, form):' not in content[content.find('class AddVacationsView'):content.find('class', content.find('class AddVacationsView')+1)]:
    content = re.sub(
        r'class AddVacationsView\(PermissionRequiredMixin, FormView\):.*?success_url = reverse_lazy\("Attendance:vacation"\)',
        '''class AddVacationsView(PermissionRequiredMixin, FormView):
    template_name = "attendance/vacations/add_edit_vacation.html"
    form_class = AddVacationForm
    model = Vacation
    success_url = reverse_lazy("Attendance:vacation")
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True

    def form_valid(self, form):
        # This view uses a Form and manual object creation for multiple employees
        date = form.cleaned_data['date']
        to_date = form.cleaned_data['to_date']
        vacation_type = form.cleaned_data['type']
        employees = form.cleaned_data['employees']
        note = form.cleaned_data['note']
        for employee in employees:
            v = Vacation(employee=employee, date=date, to_date=to_date, vacation_type=vacation_type, note=note)
            v.save()
        
        SystemLog.objects.create(
            user=self.request.user,
            action="إضافة إجازات جماعية",
            description=f"تم إضافة إجازة لعدد {employees.count()} موظف للفترة من {date} إلى {to_date}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return super().form_valid(form)''',
        content,
        flags=re.DOTALL
    )

# Add logging to DeleteVacationView
content = re.sub(
    r'class DeleteVacationView\(DeleteView\):.*?def delete\(self, request, \*args, \*\*kwargs\):',
    '''class DeleteVacationView(PermissionRequiredMixin, DeleteView):
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True
    model = Vacation
    success_url = reverse_lazy("Attendance:vacation")

    def delete(self, request, *args, **kwargs):
        obj = self.get_object()
        SystemLog.objects.create(
            user=self.request.user,
            action="حذف إجازة",
            description=f"تم حذف إجازة الموظف: {obj.employee.name} للفترة من {obj.date} إلى {obj.to_date}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return super().delete(request, *args, **kwargs)''',
    content,
    flags=re.DOTALL
)

# Add logging to AddExceptionsView
if 'def form_valid(self, form):' not in content[content.find('class AddExceptionsView'):content.find('class', content.find('class AddExceptionsView')+1)]:
    content = re.sub(
        r'class AddExceptionsView\(PermissionRequiredMixin, FormView\):.*?success_url = reverse_lazy\("Attendance:exception"\)',
        '''class AddExceptionsView(PermissionRequiredMixin, FormView):
    template_name = "attendance/exceptions/add_edit_exception.html"
    form_class = AddExceptionForm
    model = Exception
    success_url = reverse_lazy("Attendance:exception")
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True

    def form_valid(self, form):
        date = form.cleaned_data['date']
        exception_type = form.cleaned_data['type']
        employees = form.cleaned_data['employees']
        note = form.cleaned_data['note']
        for employee in employees:
            e = Exception(employee=employee, date=date, type=exception_type, note=note)
            e.save()
        
        SystemLog.objects.create(
            user=self.request.user,
            action="إضافة استثناءات جماعية",
            description=f"تم إضافة استثناء {dict(Exception.types).get(exception_type)} لعدد {employees.count()} موظف بتاريخ {date}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return super().form_valid(form)''',
        content,
        flags=re.DOTALL
    )

# Add logging to EditExceptionView
if 'def form_valid(self, form):' not in content[content.find('class EditExceptionView'):content.find('class', content.find('class EditExceptionView')+1)]:
    content = re.sub(
        r'class EditExceptionView\(PermissionRequiredMixin, UpdateView\):.*?model = Exception',
        '''class EditExceptionView(PermissionRequiredMixin, UpdateView):
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True
    template_name = "attendance/exceptions/edit_exception.html"
    form_class = EditExceptionForm
    model = Exception
    success_url = reverse_lazy("Attendance:exception")

    def form_valid(self, form):
        response = super().form_valid(form)
        SystemLog.objects.create(
            user=self.request.user,
            action="تعديل استثناء",
            description=f"تم تعديل استثناء الموظف: {self.object.employee.name}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return response''',
        content,
        flags=re.DOTALL
    )

# Add logging to DeleteExceptionView
content = re.sub(
    r'class DeleteExceptionView\(DeleteView\):.*?def delete\(self, request, \*args, \*\*kwargs\):',
    '''class DeleteExceptionView(PermissionRequiredMixin, DeleteView):
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True
    model = Exception
    success_url = reverse_lazy("Attendance:exception")

    def delete(self, request, *args, **kwargs):
        obj = self.get_object()
        SystemLog.objects.create(
            user=self.request.user,
            action="حذف استثناء",
            description=f"تم حذف استثناء الموظف: {obj.employee.name} بتاريخ {obj.date}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return super().delete(request, *args, **kwargs)''',
    content,
    flags=re.DOTALL
)

with open('/Users/zakaria/projects/antigravity/attendance/Attendance/views.py', 'w') as f:
    f.write(content)
