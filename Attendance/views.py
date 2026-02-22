import calendar
import datetime
import io
from datetime import date
from typing import Any, Dict

import xlsxwriter
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.db.models import Q
from django.http import HttpResponse
from django.template.response import TemplateResponse
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.utils import timezone
from django.views import View
from django.views.generic import ListView, CreateView, UpdateView, DetailView, TemplateView, DeleteView, RedirectView, \
    FormView

from Attendance.forms import *  # EditVacationForm, EmployeeForm, ProfileForm, DeviceForm, ReportFilterForm, AddVacationForm, AddVacationTypeForm, FilterVacationsForm,FilterExceptionsForm
from Attendance.models import Employee, Profile, Record, WorkDay, ZKTDevice, Vacation, VacationType, Exception
from Attendance.sync_records import sync_all, sync_all_devices


def default_date_range(view):
    from_date = None
    to_date = None

    get = view.request.GET
    if "from_date" in get.keys():
        fromdate = get["from_date"]
        if len(fromdate) > 2:
            from_date = datetime.datetime.strptime(fromdate, "%Y-%m-%d")

    if "to_date" in get.keys():
        todate = get["to_date"]
        if len(todate) > 2:
            to_date = datetime.datetime.strptime(todate, "%Y-%m-%d")

    this_month = timezone.now().month
    this_year = timezone.now().year
    _, last_day_in_the_month = calendar.monthrange(this_year, this_month)

    if from_date is None:
        from_date = date(this_year, this_month, 1)

    if to_date is None:
        to_date = date(this_year, this_month, last_day_in_the_month)
    return from_date, to_date


def required_days(from_date, to_date):
    c = 0
    total = 0
    for d in range(from_date.toordinal(), to_date.toordinal()):
        dt = date.fromordinal(d)
        if dt.weekday() == 4 or dt.weekday() == 5:
            c += 1;
        total += 1;

    return total - c


def data_device(view):
    get = view.request.GET
    if "device" in get.keys():
        device = get['device']

        try:
            device = ZKTDevice.objects.get(id__exact=device)
            return device
        except ZKTDevice.DoesNotExist:
            pass

    return ZKTDevice.objects.order_by('id').first()


class AddEmployeeView(CreateView):
    template_name = "attendance/add_edit_employee.html"
    form_class = EmployeeForm
    model = Employee
    success_url = reverse_lazy("Attendance:list")
    permission_required = ('Attendance.can_create_employees',)

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class SyncDevicesView(RedirectView):
    url = reverse_lazy("Attendance:list")
    permission_required = ('Attendance.can_create_employees',)

    def get(self, request, *args, **kwargs):

        try:
            sync_all_devices()
        except:
            pass
            # return TemplateResponse(request,"error.html")
        return super().get(request, *args, **kwargs)


class EditEmployeeView(UpdateView):
    template_name = "attendance/add_edit_employee.html"
    form_class = EmployeeForm
    model = Employee
    success_url = reverse_lazy("Attendance:list")
    permission_required = ('Attendance.can_edit_employees',)

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class EmployeeView(ListView):
    template_name = "attendance/employee_list_view.html"
    model = Employee
    success_url = reverse_lazy("Attendance:home")
    permission_required = ("Attendance.can_view_employees",)

    def get(self, request, *args, **kwargs):
        # if request.user.is_authenticated:
        # return redirect("home")
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        if "q" in self.request.GET.keys():
            q = self.request.GET['q']
            query = Employee.objects.filter(Q(name__icontains=q) | Q(attendance_id__icontains=q))
            return query.order_by("attendance_id")
        return super().get_queryset().order_by("-name")


class EmployeeRecordsView(DetailView):
    template_name = "attendance/reports/employee_report.html"
    model = Employee
    success_url = reverse_lazy("Attendance:home")
    permission_required = ("Attendance.can_view_employees",)

    def get_context_data(self, **kwargs):
        data = super().get_context_data(**kwargs)
        employee = self.get_object()
        form = ReportFilterForm()
        device = data_device(self)
        from_date, to_date = default_date_range(self)
        form.initial['from_date'] = from_date.strftime("%Y-%m-%d")
        form.initial['to_date'] = to_date.strftime("%Y-%m-%d")
        data["days"] = employee.days(from_date, to_date)
        data["form"] = form
        data["device"] = device
        return data

    def get(self, request, *args, **kwargs):

        return super().get(request, *args, **kwargs)

    def get_object(self, queryset=None):
        from_date, to_date = default_date_range(self)
        device = data_device(self)
        obj = super().get_object(queryset)
        print("from_date", from_date)
        print("to_date", to_date)
        print("Date of things")
        wds = WorkDay.objects.filter(device=device)
        rcs = Record.objects.filter(device=device)
        if from_date:
            wds = wds.filter(Q(date__gte=from_date))
            rcs = rcs.filter(Q(timestamp__gte=from_date))
        if to_date:
            wds = wds.filter(Q(date__lte=to_date))
            rcs = rcs.filter(Q(timestamp__lte=to_date))

        wds = list(wds)
        rcs = list(rcs)

        obj.set_records(rcs)
        obj.set_workdays(wds)
        return obj


class ProfileListView(ListView):
    template_name = "attendance/profile_list_view.html"
    model = Profile

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class AddProfileView(CreateView):
    template_name = "attendance/add_edit_profile.html"
    form_class = ProfileForm
    model = Profile
    success_url = reverse_lazy("Attendance:profiles")

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class EditProfileView(UpdateView):
    template_name = "attendance/add_edit_profile.html"
    form_class = ProfileForm
    model = Profile
    success_url = reverse_lazy("Attendance:profiles")

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class DeleteProfileView(DeleteView):
    template_name = "attendance/delete_form.html"
    model = Profile
    success_url = reverse_lazy("Attendance:profiles")


class ReportView(TemplateView):
    template_name = "attendance/reports/monthly_report.html"
    # if Profile.objects.all().count() == 0:
    #     template_name = "attendance/employee_list_view.html"

    model = Employee

    def get_template_names(self):
        if Profile.objects.all().count() < 1:
            name = "create_profile_first.html"
            return [name]
        device = data_device(self)
        if device.out_during_work:
            name = "attendance/reports/out_during_work.html"
            return [name]
        return super().get_template_names()

    def get_context_data(self, **kwargs):
        from_date, to_date = default_date_range(self)
        device = data_device(self)
        data = super().get_context_data(**kwargs)
        em = list(Employee.objects.filter(active=False))
        wds = WorkDay.objects.filter(Q(date__gte=from_date) & Q(date__lte=to_date) & Q(device=device))
        rcs = Record.objects.filter(Q(timestamp__gte=from_date) & Q(timestamp__lte=to_date) & Q(device=device))
        wds = list(wds)
        rcs = list(rcs)

        _ = [(e.set_records(rcs), e.set_workdays(wds)) for e in em]
        data["object_list"] = em
        data["from_date"] = from_date.strftime("%Y-%m-%d")
        data["to_date"] = to_date.strftime("%Y-%m-%d")
        data["device"] = device
        data["required_days"] = required_days(from_date, to_date)

        form = ReportFilterForm()
        from_date, to_date = default_date_range(self)
        form.initial['from_date'] = from_date.strftime("%Y-%m-%d")
        form.initial['to_date'] = to_date.strftime("%Y-%m-%d")

        data["form"] = form

        old_q = "&".join([f"{k}={v}" for k, v in self.request.GET.items() if k != "page"])
        data["old_q"] = old_q
        return data

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class ExportReportView(View):

    def get(self, request, *args, **kwargs):
        from_date, to_date = default_date_range(self)
        device = data_device(self)

        em = list(Employee.objects.filter(active=False))
        wds = WorkDay.objects.filter(Q(date__gte=from_date) & Q(date__lte=to_date) & Q(device=device))
        rcs = Record.objects.filter(Q(timestamp__gte=from_date) & Q(timestamp__lte=to_date) & Q(device=device))
        wds = list(wds)
        rcs = list(rcs)
        required_work_days = required_days(from_date, to_date)

        _ = [(e.set_records(rcs), e.set_workdays(wds)) for e in em]

        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet()
        worksheet.write(0, 0, "الاسم")
        worksheet.write(0, 1, "اجمالي ساعات العمل")
        worksheet.write(0, 2, "الايام المطلوبة")
        worksheet.write(0, 3, "ايام العمل")
        worksheet.write(0, 4, "ايام التآخير")
        worksheet.write(0, 5, "ايام المناوبة")
        worksheet.write(0, 6, "الاجازات")
        for row_num, row in enumerate(em):
            worksheet.write(row_num + 1, 0, row.name)
            worksheet.write(row_num + 1, 1, row.count_hours)
            worksheet.write(row_num + 1, 2, required_work_days)
            worksheet.write(row_num + 1, 3, row.all_days_count)
            worksheet.write(row_num + 1, 4, row.late_days_count)
            worksheet.write(row_num + 1, 5, row.holidays_count)
            worksheet.write(row_num + 1, 6, row.vacations_count)

        workbook.close()

        # Rewind the buffer.
        output.seek(0)

        # Set up the Http response.
        filename = 'report.xlsx'
        response = HttpResponse(
            output,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=%s' % filename

        return response


class ExportEmployeeReportView(DetailView):
    model = Employee

    def get(self, request, *args, **kwargs):
        employee = self.get_object()
        device = data_device(self)
        from_date, to_date = default_date_range(self)

        # workdays = employee.days(from_date, to_date)
        wds = WorkDay.objects.filter(Q(date__gte=from_date) & Q(date__lte=to_date) & Q(device=device))
        rcs = Record.objects.filter(Q(timestamp__gte=from_date) & Q(timestamp__lte=to_date) & Q(device=device))
        wds = list(wds)
        rcs = list(rcs)
        employee.set_records(rcs)
        employee.set_workdays(wds)

        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet()
        worksheet.write(0, 0, "Date")
        worksheet.write(0, 1, "Work time")
        worksheet.write(0, 2, "Over work time")
        worksheet.write(0, 3, "Exit and return")
        for row_num, row in enumerate(employee.days()):
            # WorkDay.out_return_time

            worksheet.write(row_num + 1, 0, row.get_formatted_date())
            worksheet.write(row_num + 1, 1, row.work)
            worksheet.write(row_num + 1, 2, row.overwork)
            worksheet.write(row_num + 1, 3, row.out_return_time)

        workbook.close()

        # Rewind the buffer.
        output.seek(0)

        # Set up the Http response.
        filename = 'report.xlsx'
        response = HttpResponse(
            output,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=%s' % filename

        return response


class DeviceListView(ListView):
    template_name = "attendance/devices_list_view.html"
    model = ZKTDevice

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class EditDeviceView(UpdateView):
    template_name = "attendance/add_edit_device.html"
    form_class = DeviceForm
    model = ZKTDevice
    success_url = reverse_lazy("Attendance:devices")

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class AddDeviceView(CreateView):
    template_name = "attendance/add_edit_device.html"
    form_class = DeviceForm
    model = ZKTDevice
    success_url = reverse_lazy("Attendance:devices")

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class VacationsView(ListView):
    template_name = "attendance/vacations/vacations_list_view.html"
    form_class = Vacation
    model = Vacation

    # success_url = reverse_lazy("Attendance:devices")

    def get_context_data(self, **kwargs):
        data = super().get_context_data(**kwargs)
        data["search_form"] = FilterVacationsForm()
        return data

    def get_queryset(self):
        q = super().get_queryset()
        print(q)
        print(q.count())
        g = self.request.GET

        if g.get('employees', "") != "":
            q = q.filter(employee_id=g.get('employees', None))

        if g.get('vacation_type', "") != "":
            q = q.filter(vacation_type_id=g.get('type', None))

        if g.get('date', "") != "":
            q = q.filter(date__gte=g.get('date', None))

        if g.get('to_date', "") != "":
            q = q.filter(date__lte=g.get('to_date', None))

        return q

    def get(self, request, *args, **kwargs):

        return super().get(request, *args, **kwargs)


class AddVacationsView(FormView):
    template_name = "attendance/vacations/add_edit_vacation.html"
    form_class = AddVacationForm
    model = Vacation
    success_url = reverse_lazy("Attendance:vacation")
    permission_required = ('Attendance.can_create_employees',)

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs) -> HttpResponse:
        return super().post(request, *args, **kwargs)

    def form_valid(self, form) -> HttpResponse:
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
        return super().form_valid(form)


class AddVacationTypeView(CreateView):
    template_name = "attendance/vacations/add_edit_vacation_type.html"
    form_class = AddVacationTypeForm
    model = VacationType
    success_url = reverse_lazy("Attendance:list")
    permission_required = ('Attendance.can_create_employees',)

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class EditVacationTypeView(UpdateView):
    template_name = "attendance/vacations/add_edit_vacation_type.html"
    form_class = AddVacationTypeForm
    model = VacationType
    success_url = reverse_lazy("Attendance:vacation")
    permission_required = ('Attendance.can_create_employees',)

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class VacationTypeView(ListView):
    template_name = "attendance/vacations/vacation_type_list_view.html"
    model = VacationType

    permission_required = ('Attendance.can_create_employees',)

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class EditVacationView(UpdateView):
    template_name = "attendance/vacations/edit_vacation.html"
    form_class = EditVacationForm
    model = Vacation
    success_url = reverse_lazy("Attendance:vacation")
    permission_required = ('Attendance.can_create_employees',)

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class DeleteVacationView(DeleteView):
    template_name = "attendance/delete_form.html"
    model = Vacation
    success_url = reverse_lazy("Attendance:vacation")
    extra_context = {
        "back_url": reverse_lazy("Attendance:vacation")
    }


class ExceptionsView(ListView):
    template_name = "attendance/exceptions/exceptions_list_view.html"
    # form_class = Vacation
    model = Exception

    def get_queryset(self):
        q = super().get_queryset()
        g = self.request.GET

        if g.get('employees', "") != "":
            q = q.filter(employee_id=g.get('employees', None))

        if g.get('type', "") != "":
            q = q.filter(type=g.get('type', None))

        if g.get('date', "") != "":
            q = q.filter(date__gte=g.get('date', None))

        return q

    # success_url = reverse_lazy("Attendance:devices")

    def get_context_data(self, **kwargs):
        data = super().get_context_data(**kwargs)
        data["search_form"] = FilterExceptionsForm()
        return data

    def get(self, request, *args, **kwargs):

        return super().get(request, *args, **kwargs)


class AddExceptionsView(FormView):
    template_name = "attendance/exceptions/add_edit_exception.html"
    form_class = AddExceptionForm
    model = Exception
    success_url = reverse_lazy("Attendance:exception")
    permission_required = ('Attendance.can_create_employees',)

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs) -> HttpResponse:
        return super().post(request, *args, **kwargs)

    def form_valid(self, form) -> HttpResponse:
        for e in form.data.getlist("employees"):
            Exception(date=form.data["date"],
                      note=form.data["note"],
                      type=form.data["type"],
                      employee_id=e
                      ).save()
        return super().form_valid(form)


class DeleteExceptionView(DeleteView):
    template_name = "attendance/delete_form.html"
    model = Exception
    success_url = reverse_lazy("Attendance:exception")
    extra_context = {
        "back_url": reverse_lazy("Attendance:exception")
    }


class EditExceptionView(UpdateView):
    template_name = "attendance/exceptions/edit_exception.html"
    form_class = EditExceptionForm
    model = Exception
    success_url = reverse_lazy("Attendance:exception")
    permission_required = ('Attendance.can_create_employees',)

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class AddPermission(CreateView):
    template_name = "attendance/reports/permissions.html"
    form_class = PermissionForm
    model = Record
    success_url = reverse_lazy("Attendance:list")

    def get_context_data(self, **kwargs) :
        context_data = super().get_context_data(**kwargs)
        context_data["employee"] = Employee.objects.get(id=self.kwargs["pk"])
        return context_data


class PermissionList(ListView):
    template_name = "attendance/reports/permissions.html"
    form_class = PermissionForm
    model = Record
    success_url = reverse_lazy("Attendance:list")

    def get_context_data(self, **kwargs):
        context_data = super().get_context_data(**kwargs)
        context_data["employee"] = Employee.objects.get(id=self.kwargs["pk"])
        return context_data


