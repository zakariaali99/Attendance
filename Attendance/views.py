import calendar
import datetime
import io
import os
from collections import defaultdict
from datetime import date
from typing import Any, Dict

import xlsxwriter
from django.conf import settings
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.db.models import Q
from django.http import HttpResponse, JsonResponse
from django.template.response import TemplateResponse
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.utils import timezone
from django.views import View
from django.views.generic import ListView, CreateView, UpdateView, DetailView, TemplateView, DeleteView, RedirectView, \
    FormView

from Attendance.forms import *  # EditVacationForm, EmployeeForm, ProfileForm, DeviceForm, ReportFilterForm, AddVacationForm, AddVacationTypeForm, FilterVacationsForm,FilterExceptionsForm
from Attendance.models import *
from Attendance.sync_records import sync_all, sync_all_devices
from Attendance.tasks import sync_all_devices_task
from Attendance.import_records import import_records_from_xls
from VIPAlert.models import User, SystemLog
from VIPAlert.views import ensure_default_admin

def permission_denied_view(request, exception=None):
    return render(request, '403.html', status=403)


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
    # Include both from_date and to_date in the calculation
    for d in range(from_date.toordinal(), to_date.toordinal() + 1):
        dt = date.fromordinal(d)
        # Friday (4) and Saturday (5) are common weekend days in the region
        if dt.weekday() == 4 or dt.weekday() == 5:
            c += 1
        total += 1

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


def normalize_date(value):
    if isinstance(value, datetime.datetime):
        return value.date()
    return value


def iter_dates(from_date, to_date):
    from_date = normalize_date(from_date)
    to_date = normalize_date(to_date)
    day_count = (to_date - from_date).days + 1
    return [from_date + datetime.timedelta(days=offset) for offset in range(day_count)]


def employee_day_rows(employee, from_date, to_date):
    from_date = normalize_date(from_date)
    to_date = normalize_date(to_date)
    day_range = iter_dates(from_date, to_date)
    workday_map = {workday.date: workday for workday in employee.all_days if workday.date}
    vacation_map = {}
    exception_map = defaultdict(list)
    holiday_dates = set(
        employee.holiday_set.filter(date__gte=from_date, date__lte=to_date).values_list("date", flat=True)
    )

    for vacation in employee.vacation_set.all():
        if not vacation.date or not vacation.to_date:
            continue
        start_date = max(vacation.date, from_date)
        end_date = min(vacation.to_date, to_date)
        if start_date > end_date:
            continue
        for current_date in iter_dates(start_date, end_date):
            vacation_map[current_date] = vacation

    for exception in employee.exception_set.all():
        if exception.date and from_date <= exception.date <= to_date:
            exception_map[exception.date].append(exception)

    rows = []
    for current_date in day_range:
        workday = workday_map.get(current_date)
        vacation = vacation_map.get(current_date)
        exceptions = exception_map.get(current_date, [])
        is_weekend = current_date.weekday() in (4, 5)
        is_holiday = current_date in holiday_dates

        late_minutes = 0
        work_hours = 0
        overwork_hours = 0
        out_hours = 0
        if workday is not None:
            late_minutes = round(workday.late / 60)
            work_hours = workday.work
            overwork_hours = workday.overwork
            out_hours = workday.out_return_time

        status_code = "absent"
        status_label = "غياب"
        status_short = "غ"
        note = ""

        if workday is not None:
            if late_minutes > 0 and any(exc.type == "late" for exc in exceptions):
                status_code = "excused_late"
                status_label = "تأخير بإذن"
                status_short = "ت/إ"
                note = "تأخير مع استثناء مسجل"
            elif late_minutes > 0:
                status_code = "late"
                status_label = "متأخر"
                status_short = "ت"
                note = f"{late_minutes} دقيقة"
            elif out_hours > 0:
                status_code = "out"
                status_label = "خروج أثناء العمل"
                status_short = "خ"
                note = f"{out_hours} ساعة"
            else:
                status_code = "present"
                status_label = "حاضر"
                status_short = "ح"
        elif vacation is not None:
            status_code = "vacation"
            status_label = "إجازة"
            status_short = "إ"
            note = vacation.vacation_type.title if vacation.vacation_type else ""
        elif is_holiday:
            status_code = "holiday"
            status_label = "عطلة رسمية"
            status_short = "ع"
        elif is_weekend:
            status_code = "weekend"
            status_label = "عطلة أسبوعية"
            status_short = "أ"
        elif exceptions:
            status_code = "exception"
            status_label = "إذن"
            status_short = "ذ"
            note = ", ".join(dict(Exception.types).get(exc.type, exc.type) for exc in exceptions)

        rows.append({
            "date": current_date,
            "workday": workday,
            "status_code": status_code,
            "status_label": status_label,
            "status_short": status_short,
            "note": note,
            "work": work_hours,
            "overwork": overwork_hours,
            "out_return_time": out_hours,
            "late_minutes": late_minutes,
        })
    return rows


def summarize_day_rows(day_rows):
    attended_statuses = {"present", "late", "excused_late", "out"}
    late_statuses = {"late", "excused_late"}
    return {
        "present_days": sum(1 for row in day_rows if row["status_code"] in attended_statuses),
        "late_days": sum(1 for row in day_rows if row["status_code"] in late_statuses),
        "absent_days": sum(1 for row in day_rows if row["status_code"] == "absent"),
        "vacation_days": sum(1 for row in day_rows if row["status_code"] == "vacation"),
        "holiday_days": sum(1 for row in day_rows if row["status_code"] in {"holiday", "weekend"}),
        "exception_days": sum(1 for row in day_rows if row["status_code"] in {"exception", "excused_late"}),
        "out_days": sum(1 for row in day_rows if row["status_code"] == "out"),
        "total_work_hours": round(sum(row["work"] for row in day_rows), 2),
        "total_overwork_hours": round(sum(row["overwork"] for row in day_rows), 2),
    }


def employee_queryset():
    return Employee.objects.filter(active=False).select_related('default_profile', 'device').prefetch_related(
        'vacation_set',
        'vacation_set__vacation_type',
        'extrawork_set',
        'exception_set',
        'holiday_set',
    )


class AddEmployeeView(PermissionRequiredMixin, CreateView):
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


class SyncDevicesView(PermissionRequiredMixin, TemplateView):
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True

    def get(self, request, *args, **kwargs):
        try:
            sync_all_devices_task.delay()
            return JsonResponse({'status': 'success', 'message': 'Device synchronization started in background.'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


class EditEmployeeView(PermissionRequiredMixin, UpdateView):
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


class DeleteEmployeeView(PermissionRequiredMixin, DeleteView):
    template_name = "attendance/delete_form.html"
    model = Employee
    success_url = reverse_lazy("Attendance:list")
    permission_required = ('Attendance.can_delete_employees',)
    raise_exception = True
    extra_context = {
        "back_url": reverse_lazy("Attendance:list")
    }

    def delete(self, request, *args, **kwargs):
        obj = self.get_object()
        SystemLog.objects.create(
            user=self.request.user,
            action="حذف موظف",
            description=f"تم حذف الموظف: {obj.name} (رقم البصمة: {obj.attendance_id})",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return super().delete(request, *args, **kwargs)

    def get(self, request, *args, **kwargs):
        return self.delete(request, *args, **kwargs)


class EmployeeView(PermissionRequiredMixin, ListView):
    template_name = "attendance/employee_list_view.html"
    model = Employee
    success_url = reverse_lazy("Attendance:dashboard")
    permission_required = ("Attendance.can_view_employees",)
    raise_exception = True

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        if "q" in self.request.GET.keys():
            q = self.request.GET['q']
            query = Employee.objects.filter(Q(name__icontains=q) | Q(attendance_id__icontains=q))
            return query.order_by("attendance_id")
        return super().get_queryset().order_by("-name")


class EmployeeRecordsView(PermissionRequiredMixin, DetailView):
    template_name = "attendance/reports/employee_report.html"
    model = Employee
    success_url = reverse_lazy("Attendance:dashboard")
    permission_required = ("Attendance.can_view_employees",)
    raise_exception = True

    def get_context_data(self, **kwargs):
        data = super().get_context_data(**kwargs)
        employee = self.get_object()
        form = ReportFilterForm()
        device = data_device(self)
        from_date, to_date = default_date_range(self)
        day_rows = employee_day_rows(employee, from_date, to_date)
        totals = summarize_day_rows(day_rows)
        required_work_days = required_days(from_date, to_date)
        form.initial['from_date'] = from_date.strftime("%Y-%m-%d")
        form.initial['to_date'] = to_date.strftime("%Y-%m-%d")
        data["days"] = day_rows
        data["form"] = form
        data["device"] = device
        data["present_days"] = totals["present_days"]
        data["required_days"] = required_work_days
        data["attendance_ratio"] = round((totals["present_days"] / required_work_days) * 100, 1) if required_work_days else 0
        return data

    def get(self, request, *args, **kwargs):

        return super().get(request, *args, **kwargs)

    def get_object(self, queryset=None):
        from_date, to_date = default_date_range(self)
        device = data_device(self)
        obj = super().get_object(queryset)
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


class AddProfileView(PermissionRequiredMixin, CreateView):
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

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class EditProfileView(PermissionRequiredMixin, UpdateView):
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

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class DeleteProfileView(PermissionRequiredMixin, DeleteView):
    permission_required = ('Attendance.can_delete_profiles',)
    raise_exception = True
    template_name = "attendance/delete_form.html"
    model = Profile
    success_url = reverse_lazy("Attendance:profiles")
    extra_context = {
        "back_url": reverse_lazy("Attendance:profiles")
    }

    def delete(self, request, *args, **kwargs):
        obj = self.get_object()
        SystemLog.objects.create(
            user=self.request.user,
            action="حذف نظام دوام",
            description=f"تم حذف نظام الدوام: {obj.title}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return super().delete(request, *args, **kwargs)

class ReportView(PermissionRequiredMixin, TemplateView):
    template_name = "attendance/reports/monthly_report.html"

    model = Employee
    permission_required = ("Attendance.can_view_employees",)
    raise_exception = True

    def get_template_names(self):
        if Profile.objects.all().count() < 1:
            name = "create_profile_first.html"
            return [name]
        device = data_device(self)
        if device and device.out_during_work:
            name = "attendance/reports/out_during_work.html"
            return [name]
        return super().get_template_names()

    def get_context_data(self, **kwargs):
        from_date, to_date = default_date_range(self)
        device = data_device(self)
        data = super().get_context_data(**kwargs)
        em = list(employee_queryset())
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
        data["register_url"] = reverse_lazy("Attendance:monthly_register")

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


class ExportReportView(PermissionRequiredMixin, View):
    permission_required = ("Attendance.can_view_employees",)
    raise_exception = True

    def get(self, request, *args, **kwargs):
        from_date, to_date = default_date_range(self)
        device = data_device(self)

        em = list(employee_queryset())
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

        SystemLog.objects.create(
            user=request.user,
            action="تحميل تقرير",
            description=f"تم تحميل التقرير العام للفترة من {from_date} إلى {to_date}",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return response


class ExportEmployeeReportView(PermissionRequiredMixin, DetailView):
    model = Employee
    permission_required = ("Attendance.can_view_employees",)
    raise_exception = True

    def get(self, request, *args, **kwargs):
        employee = employee_queryset().get(id=self.kwargs['pk'])
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
        worksheet.write(0, 0, "التاريخ")
        worksheet.write(0, 1, "الحالة")
        worksheet.write(0, 2, "ساعات العمل")
        worksheet.write(0, 3, "العمل الإضافي")
        worksheet.write(0, 4, "الخروج والعودة")
        worksheet.write(0, 5, "دقائق التأخير")
        worksheet.write(0, 6, "ملاحظات")
        day_rows = employee_day_rows(employee, from_date, to_date)
        for row_num, row in enumerate(day_rows):
            worksheet.write(row_num + 1, 0, row["date"].strftime("%Y-%m-%d"))
            worksheet.write(row_num + 1, 1, row["status_label"])
            worksheet.write(row_num + 1, 2, row["work"])
            worksheet.write(row_num + 1, 3, row["overwork"])
            worksheet.write(row_num + 1, 4, row["out_return_time"])
            worksheet.write(row_num + 1, 5, row["late_minutes"])
            worksheet.write(row_num + 1, 6, row["note"])

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

        SystemLog.objects.create(
            user=request.user,
            action="تحميل تقرير موظف",
            description=f"تم تحميل تقرير الموظف {employee.name} للفترة من {from_date} إلى {to_date}",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return response


class DeviceListView(ListView):
    template_name = "attendance/devices_list_view.html"
    model = ZKTDevice

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class EditDeviceView(PermissionRequiredMixin, UpdateView):
    permission_required = ('Attendance.can_edit_employees',)
    raise_exception = True
    template_name = "attendance/add_edit_device.html"
    form_class = DeviceForm
    model = ZKTDevice
    success_url = reverse_lazy("Attendance:devices")

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class AddDeviceView(PermissionRequiredMixin, CreateView):
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
        return response
    success_url = reverse_lazy("Attendance:devices")

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class DeleteDeviceView(PermissionRequiredMixin, DeleteView):
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
        return self.delete(request, *args, **kwargs)




class VacationsView(ListView):
    template_name = "attendance/vacations/vacations_list_view.html"
    form_class = Vacation
    model = Vacation

    def get_context_data(self, **kwargs):
        data = super().get_context_data(**kwargs)
        data["search_form"] = FilterVacationsForm()
        return data

    def get_queryset(self):
        q = super().get_queryset()
        g = self.request.GET
        if g.get('employees', "") != "":
            q = q.filter(employee_id=g.get('employees', None))
        if g.get('vacation_type', "") != "":
            q = q.filter(vacation_type_id=g.get('vacation_type', None))
        if g.get('date', "") != "":
            q = q.filter(date__gte=g.get('date', None))
        if g.get('to_date', "") != "":
            q = q.filter(date__lte=g.get('to_date', None))
        return q

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class AddVacationsView(PermissionRequiredMixin, FormView):
    template_name = "attendance/vacations/add_edit_vacation.html"
    form_class = AddVacationForm
    model = Vacation
    success_url = reverse_lazy("Attendance:vacation")
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True

    def form_valid(self, form):
        date = form.cleaned_data['date']
        to_date = form.cleaned_data['to_date']
        vacation_type = form.cleaned_data['type']
        employees = form.cleaned_data['employees']
        note = form.cleaned_data['note']
        for employee in employees:
            v = Vacation(employee=employee, date=date, to_date=to_date, vacation_type=vacation_type, note=note)
            v.save()
            employee.current_vacations = employee.current_vacations - (to_date - date).days
            employee.save()

        SystemLog.objects.create(
            user=self.request.user,
            action="إضافة إجازات جماعية",
            description=f"تم إضافة إجازة لعدد {employees.count()} موظف للفترة من {date} إلى {to_date}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return super().form_valid(form)


class EditVacationView(PermissionRequiredMixin, UpdateView):
    template_name = "attendance/vacations/edit_vacation.html"
    form_class = EditVacationForm
    model = Vacation
    success_url = reverse_lazy("Attendance:vacation")
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True

    def form_valid(self, form):
        response = super().form_valid(form)
        SystemLog.objects.create(
            user=self.request.user,
            action="تعديل إجازة",
            description=f"تم تعديل إجازة الموظف: {self.object.employee.name}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return response


class DeleteVacationView(PermissionRequiredMixin, DeleteView):
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
        return super().delete(request, *args, **kwargs)

    def get(self, request, *args, **kwargs):
        return self.delete(request, *args, **kwargs)


class VacationTypeView(PermissionRequiredMixin, ListView):
    template_name = "attendance/vacations/vacation_type_list_view.html"
    model = VacationType
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class AddVacationTypeView(PermissionRequiredMixin, CreateView):
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
        return response


class EditVacationTypeView(PermissionRequiredMixin, UpdateView):
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
        return response


class DeleteVacationTypeView(PermissionRequiredMixin, DeleteView):
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
        return super().delete(request, *args, **kwargs)


class ExceptionsView(ListView):
    template_name = "attendance/exceptions/exceptions_list_view.html"
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

    def get_context_data(self, **kwargs):
        data = super().get_context_data(**kwargs)
        data["search_form"] = FilterExceptionsForm()
        return data

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class AddExceptionsView(PermissionRequiredMixin, FormView):
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
        return super().form_valid(form)


class DeleteExceptionView(PermissionRequiredMixin, DeleteView):
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
        return super().delete(request, *args, **kwargs)


class EditExceptionView(PermissionRequiredMixin, UpdateView):
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
        return response


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


class DashboardView(TemplateView):
    template_name = "attendance/dashboard.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        today = timezone.now().date()
        
        # Simple overview metrics
        total_employees = Employee.objects.all()
        today_workdays = WorkDay.objects.filter(date=today)
        today_exceptions = Exception.objects.filter(date=today)
        
        context['count_employees'] = total_employees.count()
        context['count_presents'] = today_workdays.count()
        context['count_permissions'] = today_exceptions.count()
        context['count_absents'] = total_employees.count() - today_workdays.count()
        
        # Anomaly Detection: Employees late more than 3 times in the last 30 days
        recent_date_limit = today - datetime.timedelta(days=30)
        
        # Anomaly Detection: Employees late more than 3 times in the last 30 days
        # Since 'late' is a property and not a DB field, we calculate it in Python
        # We limit the search to active employees and recent workdays for performance
        recent_date_limit = today - datetime.timedelta(days=30)
        anomalies = []
        
        # We process a subset of employees to keep dashboard responsive
        # In a production environment with many employees, this should be a background task or cached
        for emp in Employee.objects.filter(active=False)[:50]:
            recent_wds = WorkDay.objects.filter(employee=emp, date__gte=recent_date_limit)
            late_count = 0
            for wd in recent_wds:
                if wd.late > 0:
                    late_count += 1
            
            if late_count > 3:
                anomalies.append({
                    'id': emp.id,
                    'name': emp.name,
                    'recent_late_count': late_count
                })
        
        anomalies.sort(key=lambda x: x['recent_late_count'], reverse=True)
        context['anomalies'] = anomalies[:5] # Show top 5 anomalies
        return context


class SettingsView(PermissionRequiredMixin, TemplateView):
    template_name = "attendance/settings.html"
    permission_required = ("Attendance.can_view_employees",)
    raise_exception = True

    def post(self, request, *args, **kwargs):
        action = request.POST.get("action")
        if action == "reset_default_admin":
            ensure_default_admin()
            return JsonResponse({
                "status": "success",
                "message": "Default admin credentials have been reset to admin / admin.",
            })
        return JsonResponse({"status": "error", "message": "Unknown action."}, status=400)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        default_admin = User.objects.filter(email__iexact="admin").first()
        report_device = ZKTDevice.objects.order_by("id").first()

        context["runtime_settings"] = [
            ("بيئة التشغيل", "Development" if getattr(settings, "DEBUG", False) else "Production"),
            ("اللغة", settings.LANGUAGE_CODE),
            ("المنطقة الزمنية", settings.TIME_ZONE),
            ("المسار الثابت", settings.STATIC_URL),
            ("عدد المضيفين", str(len(settings.ALLOWED_HOSTS))),
            ("مسار العقود", getattr(settings, "CONTRACTS_ROOT", "-")),
            ("وسيط Celery", getattr(settings, "CELERY_BROKER_URL", "-")),
        ]
        context["system_counts"] = {
            "employees": Employee.objects.count(),
            "active_employees": Employee.objects.filter(active=False).count(),
            "devices": ZKTDevice.objects.count(),
            "profiles": Profile.objects.count(),
            "vacation_types": VacationType.objects.count(),
            "exceptions": Exception.objects.count(),
            "users": User.objects.count(),
        }
        context["default_admin"] = default_admin
        context["report_device"] = report_device
        context["report_status"] = {
            "monthly_register_ready": True,
            "summary_report_ready": True,
            "employee_report_ready": True,
            "default_device_name": report_device.name if report_device else "No device configured",
        }
        context["storage_status"] = {
            "database_name": os.path.basename(settings.DATABASES["default"]["NAME"]),
            "contracts_root_exists": os.path.isdir(getattr(settings, "CONTRACTS_ROOT", "")),
            "static_root_exists": os.path.isdir(getattr(settings, "STATIC_ROOT", "")),
        }
        return context


class MonthlyRegisterView(PermissionRequiredMixin, TemplateView):
    template_name = "attendance/reports/monthly_register.html"
    permission_required = ("Attendance.can_view_employees",)
    raise_exception = True

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        from_date, to_date = default_date_range(self)
        device = data_device(self)
        employees = list(employee_queryset())
        workdays = list(WorkDay.objects.filter(Q(date__gte=from_date) & Q(date__lte=to_date) & Q(device=device)))
        records = list(Record.objects.filter(Q(timestamp__gte=from_date) & Q(timestamp__lte=to_date) & Q(device=device)))
        for employee in employees:
            employee.set_records(records)
            employee.set_workdays(workdays)

        day_range = iter_dates(from_date, to_date)
        register_rows = []
        for employee in employees:
            day_rows = employee_day_rows(employee, from_date, to_date)
            totals = summarize_day_rows(day_rows)
            register_rows.append({
                "employee": employee,
                "days": day_rows,
                "totals": totals,
            })

        form = ReportFilterForm()
        form.initial['from_date'] = from_date.strftime("%Y-%m-%d")
        form.initial['to_date'] = to_date.strftime("%Y-%m-%d")

        old_q = "&".join([f"{k}={v}" for k, v in self.request.GET.items() if k != "page"])
        context.update({
            "object_list": employees,
            "register_rows": register_rows,
            "day_range": day_range,
            "form": form,
            "device": device,
            "from_date": normalize_date(from_date),
            "to_date": normalize_date(to_date),
            "old_q": old_q,
        })
        return context


class ExportMonthlyRegisterView(PermissionRequiredMixin, View):
    permission_required = ("Attendance.can_view_employees",)
    raise_exception = True

    def get(self, request, *args, **kwargs):
        from_date, to_date = default_date_range(self)
        device = data_device(self)
        employees = list(employee_queryset())
        workdays = list(WorkDay.objects.filter(Q(date__gte=from_date) & Q(date__lte=to_date) & Q(device=device)))
        records = list(Record.objects.filter(Q(timestamp__gte=from_date) & Q(timestamp__lte=to_date) & Q(device=device)))
        for employee in employees:
            employee.set_records(records)
            employee.set_workdays(workdays)

        day_range = iter_dates(from_date, to_date)
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet("Monthly Register")

        worksheet.write(0, 0, "الموظف")
        worksheet.write(0, 1, "الرقم الوظيفي")
        col = 2
        for current_date in day_range:
            worksheet.write(0, col, current_date.strftime("%d"))
            col += 1

        totals_headers = ["حضور", "تأخير", "غياب", "إجازة", "عطل", "أذونات", "إضافي"]
        for header in totals_headers:
            worksheet.write(0, col, header)
            col += 1

        for row_num, employee in enumerate(employees, start=1):
            worksheet.write(row_num, 0, employee.name)
            worksheet.write(row_num, 1, employee.attendance_id)
            day_rows = employee_day_rows(employee, from_date, to_date)
            totals = summarize_day_rows(day_rows)
            col = 2
            for day_row in day_rows:
                worksheet.write(row_num, col, day_row["status_short"])
                col += 1
            worksheet.write(row_num, col, totals["present_days"])
            worksheet.write(row_num, col + 1, totals["late_days"])
            worksheet.write(row_num, col + 2, totals["absent_days"])
            worksheet.write(row_num, col + 3, totals["vacation_days"])
            worksheet.write(row_num, col + 4, totals["holiday_days"])
            worksheet.write(row_num, col + 5, totals["exception_days"])
            worksheet.write(row_num, col + 6, totals["total_overwork_hours"])

        workbook.close()
        output.seek(0)
        filename = f"monthly-register-{normalize_date(from_date).strftime('%Y-%m')}.xlsx"
        response = HttpResponse(
            output,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename={filename}'
        SystemLog.objects.create(
            user=request.user,
            action="تحميل تقرير",
            description=f"تم تحميل التقرير العام للفترة من {from_date} إلى {to_date}",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return response


class ImportRecordsView(PermissionRequiredMixin, FormView):
    template_name = "attendance/import_data.html"
    form_class = ImportRecordsForm
    success_url = reverse_lazy("Attendance:list")
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True

    def form_valid(self, form):
        file = self.request.FILES['file']
        # Save temporary file
        temp_path = os.path.join(settings.BASE_DIR, 'data', f"temp_import_{self.request.user.id}.xls")
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        with open(temp_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)
        
        success, message = import_records_from_xls(temp_path, user=self.request.user)
        
        if success:
            SystemLog.objects.create(
                user=self.request.user,
                action="استيراد بيانات",
                description=f"تم استيراد سجلات حضور من ملف Excel: {message}",
                ip_address=self.request.META.get('REMOTE_ADDR')
            )
            return render(self.request, self.template_name, {
                'form': form,
                'success_message': message
            })
        else:
            return render(self.request, self.template_name, {
                'form': form,
                'error_message': message
            })


class ExportPayrollSummaryView(PermissionRequiredMixin, View):
    permission_required = ('Attendance.can_view_employees',)
    raise_exception = True

    def get(self, request, *args, **kwargs):
        from_date, to_date = default_date_range(self)
        if not from_date or not to_date:
            return HttpResponse("Invalid date range", status=400)

        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet("Payroll Summary")
        worksheet.right_to_left()

        header_fmt = workbook.add_format({
            'bold': True, 'bg_color': '#1e293b', 'font_color': 'white',
            'border': 1, 'align': 'center', 'valign': 'vcenter'
        })
        cell_fmt = workbook.add_format({'border': 1, 'align': 'center'})

        headers = ['الاسم', 'نظام العمل', 'اجمالي ساعات العمل', 'ايام التأخير', 'الاجازات', 'الاضافي', 'ايام الاضافي', 'الايام المطلوبة', 'ايام الحضور', 'الايام المستحقه']
        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_fmt)
            worksheet.set_column(col, col, 15)

        employees = Employee.objects.all().prefetch_related('vacation_set', 'exception_set')
        
        row_num = 1
        for emp in employees:
            profile = emp.default_profile or Profile.objects.first()
            if not profile: continue

            workdays = WorkDay.objects.filter(employee=emp, date__range=[from_date, to_date])
            
            total_work_hours = 0
            late_days_count = 0
            overtime_hours = 0
            overtime_days_count = 0
            present_days_count = workdays.count()
            
            late_threshold = getattr(profile, 'late_threshold', 15)

            for wd in workdays:
                total_work_hours += (wd.work or 0) + (wd.overwork or 0)
                if wd.late > (late_threshold * 60):
                    late_days_count += 1
                if (wd.overwork or 0) > 0:
                    overtime_hours += wd.overwork
                    overtime_days_count += 1

            vacations = Vacation.objects.filter(employee=emp, date__lte=to_date, to_date__gte=from_date)
            vacation_days = 0
            for v in vacations:
                v_start = max(v.date, from_date.date())
                v_end = min(v.to_date, to_date.date())
                vacation_days += (v_end - v_start).days + 1

            profile_days = [int(d.day) for d in profile.days.all()]
            required_days = 0
            current_day = from_date.date()
            while current_day <= to_date.date():
                weekday_map = {5: 0, 6: 1, 0: 2, 1: 3, 2: 4, 3: 5, 4: 6}
                day_index = weekday_map.get(current_day.weekday())
                if day_index in profile_days:
                    required_days += 1
                current_day += datetime.timedelta(days=1)

            accrued_days = present_days_count + vacation_days

            data = [
                emp.name,
                profile.name,
                round(total_work_hours, 2),
                late_days_count,
                vacation_days,
                round(overtime_hours, 2),
                overtime_days_count,
                required_days,
                present_days_count,
                accrued_days
            ]
            
            for col, val in enumerate(data):
                worksheet.write(row_num, col, val, cell_fmt)
            row_num += 1

        workbook.close()
        output.seek(0)
        filename = f"payroll-summary-{from_date.strftime('%Y-%m-%d')}-to-{to_date.strftime('%Y-%m-%d')}.xlsx"
        
        response = HttpResponse(
            output,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename={filename}'
        
        SystemLog.objects.create(
            user=request.user,
            action="تحميل تقرير الرواتب",
            description=f"تم تحميل ملخص الرواتب للفترة من {from_date} إلى {to_date}",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return response
