import re

with open('/Users/zakaria/projects/antigravity/attendance/Attendance/views.py', 'r') as f:
    content = f.read()

# Add logging to AddVacationTypeView
if 'def form_valid(self, form):' not in content[content.find('class AddVacationTypeView'):content.find('class', content.find('class AddVacationTypeView')+1)]:
    content = re.sub(
        r'class AddVacationTypeView\(PermissionRequiredMixin, CreateView\):.*?model = VacationType',
        '''class AddVacationTypeView(PermissionRequiredMixin, CreateView):
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True
    template_name = "attendance/vacations/add_edit_vacation_type.html"
    form_class = AddVacationTypeForm
    model = VacationType
    success_url = reverse_lazy("Attendance:vacation_types")

    def form_valid(self, form):
        response = super().form_valid(form)
        SystemLog.objects.create(
            user=self.request.user,
            action="إضافة نوع إجازة",
            description=f"تم إضافة نوع إجازة جديد: {self.object.name}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return response''',
        content,
        flags=re.DOTALL
    )

# Add logging to EditVacationTypeView
if 'def form_valid(self, form):' not in content[content.find('class EditVacationTypeView'):content.find('class', content.find('class EditVacationTypeView')+1)]:
    content = re.sub(
        r'class EditVacationTypeView\(PermissionRequiredMixin, UpdateView\):.*?model = VacationType',
        '''class EditVacationTypeView(PermissionRequiredMixin, UpdateView):
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True
    template_name = "attendance/vacations/add_edit_vacation_type.html"
    form_class = AddVacationTypeForm
    model = VacationType
    success_url = reverse_lazy("Attendance:vacation_types")

    def form_valid(self, form):
        response = super().form_valid(form)
        SystemLog.objects.create(
            user=self.request.user,
            action="تعديل نوع إجازة",
            description=f"تم تعديل نوع الإجازة: {self.object.name}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return response''',
        content,
        flags=re.DOTALL
    )

# Add logging to DeleteVacationTypeView
content = re.sub(
    r'class DeleteVacationTypeView\(DeleteView\):.*?def delete\(self, request, \*args, \*\*kwargs\):',
    '''class DeleteVacationTypeView(PermissionRequiredMixin, DeleteView):
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True
    model = VacationType
    success_url = reverse_lazy("Attendance:vacation_types")

    def delete(self, request, *args, **kwargs):
        obj = self.get_object()
        SystemLog.objects.create(
            user=self.request.user,
            action="حذف نوع إجازة",
            description=f"تم حذف نوع الإجازة: {obj.name}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return super().delete(request, *args, **kwargs)''',
    content,
    flags=re.DOTALL
)

with open('/Users/zakaria/projects/antigravity/attendance/Attendance/views.py', 'w') as f:
    f.write(content)
