import re

with open('/Users/zakaria/projects/antigravity/attendance/Attendance/views.py', 'r') as f:
    content = f.read()

# Add PermissionRequiredMixin and logging to AddProfileView
content = re.sub(
    r'class AddProfileView\(CreateView\):',
    'class AddProfileView(PermissionRequiredMixin, CreateView):\\n    permission_required = (\'Attendance.can_create_profiles\',)\\n    raise_exception = True',
    content
)
content = re.sub(
    r'class AddProfileView\(PermissionRequiredMixin, CreateView\):.*?def get\(self, request, \*args, \*\*kwargs\):',
    '''class AddProfileView(PermissionRequiredMixin, CreateView):
    permission_required = ('Attendance.can_create_profiles',)
    raise_exception = True
    template_name = "attendance/add_edit_profile.html"
    form_class = ProfileForm
    model = Profile
    success_url = reverse_lazy("Attendance:profiles")

    def form_valid(self, form):
        response = super().form_valid(form)
        SystemLog.objects.create(
            user=self.request.user,
            action="إضافة نظام دوام",
            description=f"تم إضافة نظام دوام جديد: {self.object.name}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return response

    def get(self, request, *args, **kwargs):''',
    content,
    flags=re.DOTALL
)

# Add PermissionRequiredMixin and logging to EditProfileView
content = re.sub(
    r'class EditProfileView\(UpdateView\):',
    'class EditProfileView(PermissionRequiredMixin, UpdateView):\\n    permission_required = (\'Attendance.can_edit_profiles\',)\\n    raise_exception = True',
    content
)
content = re.sub(
    r'class EditProfileView\(PermissionRequiredMixin, UpdateView\):.*?def get\(self, request, \*args, \*\*kwargs\):',
    '''class EditProfileView(PermissionRequiredMixin, UpdateView):
    permission_required = ('Attendance.can_edit_profiles',)
    raise_exception = True
    template_name = "attendance/add_edit_profile.html"
    form_class = ProfileForm
    model = Profile
    success_url = reverse_lazy("Attendance:profiles")

    def form_valid(self, form):
        response = super().form_valid(form)
        SystemLog.objects.create(
            user=self.request.user,
            action="تعديل نظام دوام",
            description=f"تم تعديل نظام الدوام: {self.object.name}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return response

    def get(self, request, *args, **kwargs):''',
    content,
    flags=re.DOTALL
)

# Add PermissionRequiredMixin to DeleteProfileView
content = re.sub(
    r'class DeleteProfileView\(DeleteView\):',
    'class DeleteProfileView(PermissionRequiredMixin, DeleteView):\\n    permission_required = (\'Attendance.can_delete_profiles\',)\\n    raise_exception = True',
    content
)

# Add PermissionRequiredMixin and logging to AddDeviceView
content = re.sub(
    r'class AddDeviceView\(CreateView\):',
    '''class AddDeviceView(PermissionRequiredMixin, CreateView):
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True''',
    content
)
# Assuming it has a form_valid or adding it
if 'def form_valid(self, form):' not in content[content.find('class AddDeviceView'):content.find('class', content.find('class AddDeviceView')+1)]:
    content = re.sub(
        r'class AddDeviceView\(PermissionRequiredMixin, CreateView\):.*?model = ZKTDevice',
        '''class AddDeviceView(PermissionRequiredMixin, CreateView):
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True
    template_name = "attendance/add_edit_device.html"
    form_class = DeviceForm
    model = ZKTDevice
    success_url = reverse_lazy("Attendance:devices")

    def form_valid(self, form):
        response = super().form_valid(form)
        SystemLog.objects.create(
            user=self.request.user,
            action="إضافة جهاز بصمة",
            description=f"تم إضافة جهاز بصمة جديد: {self.object.name} ({self.object.ip})",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return response''',
        content,
        flags=re.DOTALL
    )

# Add PermissionRequiredMixin and logging to EditDeviceView
content = re.sub(
    r'class EditDeviceView\(UpdateView\):',
    '''class EditDeviceView(PermissionRequiredMixin, UpdateView):
    permission_required = ('Attendance.can_edit_employees',)
    raise_exception = True''',
    content
)

# Add PermissionRequiredMixin and logging to DeleteDeviceView
content = re.sub(
    r'class DeleteDeviceView\(DeleteView\):',
    '''class DeleteDeviceView(PermissionRequiredMixin, DeleteView):
    permission_required = ('Attendance.can_delete_employees',)
    raise_exception = True''',
    content
)
content = re.sub(
    r'class DeleteDeviceView\(PermissionRequiredMixin, DeleteView\):.*?def get\(self, request, \*args, \*\*kwargs\):.*?return self.delete\(request, \*args, \*\*kwargs\)',
    '''class DeleteDeviceView(PermissionRequiredMixin, DeleteView):
    permission_required = ('Attendance.can_delete_employees',)
    raise_exception = True
    model = ZKTDevice
    success_url = reverse_lazy("Attendance:devices")

    def delete(self, request, *args, **kwargs):
        obj = self.get_object()
        SystemLog.objects.create(
            user=self.request.user,
            action="حذف جهاز بصمة",
            description=f"تم حذف جهاز البصمة: {obj.name} ({obj.ip})",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return super().delete(request, *args, **kwargs)

    def get(self, request, *args, **kwargs):
        return self.delete(request, *args, **kwargs)''',
    content,
    flags=re.DOTALL
)

with open('/Users/zakaria/projects/antigravity/attendance/Attendance/views.py', 'w') as f:
    f.write(content)
