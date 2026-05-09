import calendar
import datetime
import io
import os
from collections import defaultdict
from datetime import date
from typing import Any, Dict
from django.core.cache import cache

import xlsxwriter
from django.conf import settings
from django.contrib.auth.mixins import PermissionRequiredMixin, UserPassesTestMixin
from django.db.models import Q, Count, Sum, Avg
from django.http import HttpResponse, HttpResponseNotAllowed, JsonResponse
from django.template.response import TemplateResponse
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.utils import timezone
from django.views import View
from django.views.generic import ListView, CreateView, UpdateView, DetailView, TemplateView, DeleteView, RedirectView, \
    FormView
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage

from Attendance.forms import *  # EditVacationForm, EmployeeForm, ProfileForm, DeviceForm, ReportFilterForm, AddVacationForm, AddVacationTypeForm, FilterVacationsForm,FilterExceptionsForm
from Attendance.models import *
from Attendance.sync_records import sync_all, sync_all_devices
from Attendance.import_records import import_records_from_xls
from VIPAlert.models import User, SystemLog
from VIPAlert.views import ensure_default_admin

def permission_denied_view(request, exception=None):
    return render(request, '403.html', status=403)


def default_date_range(view):
    from_date = None
    to_date = None
    get = view.request.GET

    try:
        if "from_date" in get and len(get["from_date"]) > 2:
            from_date = datetime.datetime.strptime(get["from_date"], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        pass

    try:
        if "to_date" in get and len(get["to_date"]) > 2:
            to_date = datetime.datetime.strptime(get["to_date"], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        pass

    now = timezone.now()
    this_month = now.month
    this_year = now.year
    _, last_day_in_the_month = calendar.monthrange(this_year, this_month)

    if from_date is None:
        from_date = date(this_year, this_month, 1)

    if to_date is None:
        to_date = date(this_year, this_month, last_day_in_the_month)
    return from_date, to_date


class PaginationMixin:
    paginate_by = 25

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Keep track of GET parameters for pagination links
        params = self.request.GET.copy()
        if 'page' in params:
            del params['page']
        context['params'] = params.urlencode()
        return context


def required_days(from_date, to_date, profile=None):
    if profile and profile.full_month_work:
        return (to_date - from_date).days + 1

    count = 0
    profile_day_values = []
    if profile:
        profile_day_values = list(profile.days.values_list('day', flat=True))

    for d in range(from_date.toordinal(), to_date.toordinal() + 1):
        dt = date.fromordinal(d)
        if profile:
            if profile.is_working_day(dt):
                count += 1
        else:
            # Default fallback if no profile provided
            if dt.weekday() != 4 and dt.weekday() != 5:
                count += 1
    return count


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
    profile = employee.default_profile or Profile.objects.first()
    for current_date in day_range:
        workday = workday_map.get(current_date)
        vacation = vacation_map.get(current_date)
        exceptions = exception_map.get(current_date, [])
        is_weekend = profile.is_weekend(current_date) if profile else current_date.weekday() in (4, 5)
        is_holiday = current_date in holiday_dates

        late_minutes = 0
        work_hours = 0
        overwork_hours = 0
        out_hours = 0
        early_exit_minutes = 0
        if workday is not None:
            late_minutes = round(workday.late / 60)
            work_hours = workday.work
            overwork_hours = workday.overwork
            out_hours = workday.out_return_time
            early_exit_minutes = round(workday.early_exit / 60)

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
            note = ", ".join(dict(AttendanceException.types).get(exc.type, exc.type) for exc in exceptions)

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
            "early_exit_minutes": early_exit_minutes,
        })
    return rows


def summarize_day_rows(day_rows):
    attended_statuses = {"present", "late", "excused_late", "out"}
    late_statuses = {"late", "excused_late"}
    early_exit_statuses = {"present", "late", "excused_late", "out"}  # Early exit can occur during any workday
    return {
        "present_days": sum(1 for row in day_rows if row["status_code"] in attended_statuses),
        "late_days": sum(1 for row in day_rows if row["status_code"] in late_statuses),
        "absent_days": sum(1 for row in day_rows if row["status_code"] == "absent"),
        "vacation_days": sum(1 for row in day_rows if row["status_code"] == "vacation"),
        "holiday_days": sum(1 for row in day_rows if row["status_code"] in {"holiday", "weekend"}),
        "exception_days": sum(1 for row in day_rows if row["status_code"] in {"exception", "excused_late"}),
        "out_days": sum(1 for row in day_rows if row["status_code"] == "out"),
        "early_exit_days": sum(1 for row in day_rows if row["early_exit_minutes"] > 0),
        "total_work_hours": round(sum(row["work"] for row in day_rows), 2),
        "total_overwork_hours": round(sum(row["overwork"] for row in day_rows), 2),
        "total_early_exit_minutes": round(sum(row["early_exit_minutes"] for row in day_rows)),
    }


def employee_queryset():
    return Employee.objects.all().select_related('default_profile', 'device').prefetch_related(
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
        # Rate limiting: only allow one sync per minute
        sync_key = 'sync_in_progress'
        if cache.get(sync_key):
            return JsonResponse({
                'status': 'error',
                'message': 'المزامنة جارية بالفعل. يرجى الانتظار حتى تنتهي.',
                'results': []
            }, status=429)
        
        cache.set(sync_key, True, 60)  # 60 second lock
        
        from Attendance.models import ZKTDevice
        results = []
        overall_success = True

        try:
            for device in ZKTDevice.objects.all():
                try:
                    sync_all(device)
                    results.append({
                        'device': device.name,
                        'ip': device.ip,
                        'status': 'success',
                        'message': 'تمت المزامنة بنجاح'
                    })
                except Exception as e:
                    overall_success = False
                    results.append({
                        'device': device.name,
                        'ip': device.ip,
                        'status': 'error',
                        'message': str(e)
                    })

            if not results:
                return JsonResponse({
                    'status': 'error',
                    'message': 'لا توجد أجهزة مسجلة في النظام.',
                    'results': []
                }, status=404)

            return JsonResponse({
                'status': 'success' if overall_success else 'partial',
                'message': 'اكتملت المزامنة' if overall_success else 'اكتملت المزامنة مع بعض الأخطاء',
                'results': results
            })
        finally:
            cache.delete(sync_key)


class TestDeviceConnectionView(PermissionRequiredMixin, View):
    """Diagnostic endpoint to test ZKTeco device connectivity without syncing data."""
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True

    def get(self, request, *args, **kwargs):
        import traceback

        # Check pyzk is installed
        try:
            from zk import ZK
        except ImportError:
            return JsonResponse({
                'status': 'error',
                'message': 'pyzk library is not installed. Run: pip install pyzk',
                'results': []
            })

        try:
            from Attendance.models import ZKTDevice
            devices = ZKTDevice.objects.all()

            if not devices.exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'No ZKTeco devices registered in the database. Please add a device first.',
                    'results': []
                })

            results = []
            for device in devices:
                result = {
                    'device': device.name,
                    'ip': device.ip,
                    'port': device.port,
                }

                # Try TCP first
                try:
                    zk = ZK(device.ip, device.port, timeout=5, force_udp=False, ommit_ping=False)
                    conn = zk.connect()
                    info = conn.get_firmware_version()
                    conn.disconnect()
                    result['status'] = 'success'
                    result['protocol'] = 'TCP'
                    result['firmware'] = str(info)
                except Exception as tcp_err:
                    # TCP failed — try UDP
                    try:
                        zk = ZK(device.ip, device.port, timeout=5, force_udp=True, ommit_ping=True)
                        conn = zk.connect()
                        info = conn.get_firmware_version()
                        conn.disconnect()
                        result['status'] = 'success'
                        result['protocol'] = 'UDP'
                        result['firmware'] = str(info)
                        result['note'] = 'TCP failed, but UDP succeeded. Sync will be updated to use UDP.'
                    except Exception as udp_err:
                        result['status'] = 'error'
                        result['tcp_error'] = str(tcp_err)
                        result['udp_error'] = str(udp_err)

                results.append(result)

            return JsonResponse({'results': results})

        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'Unexpected error: {str(e)}',
                'traceback': traceback.format_exc()
            })


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
        if request.method == "POST":
            return self.delete(request, *args, **kwargs)
        return HttpResponseNotAllowed(["POST"])


class EmployeeView(PermissionRequiredMixin, PaginationMixin, ListView):
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
        required_work_days = required_days(from_date, to_date, profile=employee.default_profile)
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


class ProfileListView(PaginationMixin, ListView):
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

    def get(self, request, *args, **kwargs):
        return HttpResponseNotAllowed(["POST"])

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
    paginate_by = 25

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
        em = list(employee_queryset().select_related('default_profile'))
        wds = list(WorkDay.objects.filter(
            Q(date__gte=from_date) & Q(date__lte=to_date) & Q(device=device)
        ).select_related('employee', 'employee__default_profile'))
        rcs = list(Record.objects.filter(
            Q(timestamp__gte=from_date) & Q(timestamp__lte=to_date) & Q(device=device)
        ).select_related('device'))

        _ = [(e.set_records(rcs), e.set_workdays(wds)) for e in em]

        paginator = Paginator(em, self.paginate_by)
        page_number = self.request.GET.get('page', 1)
        try:
            page_obj = paginator.page(page_number)
        except PageNotAnInteger:
            page_obj = paginator.page(1)
        except EmptyPage:
            page_obj = paginator.page(paginator.num_pages)

        data["object_list"] = page_obj.object_list
        data["paginator"] = paginator
        data["page_obj"] = page_obj
        data["is_paginated"] = paginator.num_pages > 1

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

        em = list(employee_queryset().select_related('default_profile'))
        wds = list(WorkDay.objects.filter(
            Q(date__gte=from_date) & Q(date__lte=to_date) & Q(device=device)
        ).select_related('employee', 'employee__default_profile'))
        rcs = list(Record.objects.filter(
            Q(timestamp__gte=from_date) & Q(timestamp__lte=to_date) & Q(device=device)
        ).select_related('device'))

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
        worksheet.write(0, 7, "دقائق الخروج المبكر")
        for row_num, row in enumerate(em):
            req_days = required_days(from_date, to_date, profile=row.default_profile)
            worksheet.write(row_num + 1, 0, row.name)
            worksheet.write(row_num + 1, 1, row.count_hours)
            worksheet.write(row_num + 1, 2, req_days)
            worksheet.write(row_num + 1, 3, row.all_days_count)
            worksheet.write(row_num + 1, 4, row.late_days_count)
            worksheet.write(row_num + 1, 5, row.holidays_count)
            worksheet.write(row_num + 1, 6, row.vacations_count)
            worksheet.write(row_num + 1, 7, row.early_exit_min)

        workbook.close()

        # Rewind the buffer.
        output.seek(0)

        # Set up the Http response.
        filename = f"general-report-{from_date.strftime('%Y-%m-%d')}_to_{to_date.strftime('%Y-%m-%d')}.xlsx"
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
        employee = employee_queryset().select_related('default_profile').get(id=self.kwargs['pk'])
        device = data_device(self)
        from_date, to_date = default_date_range(self)

        wds = list(WorkDay.objects.filter(
            Q(date__gte=from_date) & Q(date__lte=to_date) & Q(device=device)
        ).select_related('employee', 'employee__default_profile'))
        rcs = list(Record.objects.filter(
            Q(timestamp__gte=from_date) & Q(timestamp__lte=to_date) & Q(device=device)
        ).select_related('device'))
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
        worksheet.write(0, 6, "دقائق الخروج المبكر")
        worksheet.write(0, 7, "ملاحظات")
        day_rows = employee_day_rows(employee, from_date, to_date)
        for row_num, row in enumerate(day_rows):
            worksheet.write(row_num + 1, 0, row["date"].strftime("%Y-%m-%d"))
            worksheet.write(row_num + 1, 1, row["status_label"])
            worksheet.write(row_num + 1, 2, row["work"])
            worksheet.write(row_num + 1, 3, row["overwork"])
            worksheet.write(row_num + 1, 4, row["out_return_time"])
            worksheet.write(row_num + 1, 5, row["late_minutes"])
            worksheet.write(row_num + 1, 6, row["early_exit_minutes"])
            worksheet.write(row_num + 1, 7, row["note"])

        workbook.close()

        # Rewind the buffer.
        output.seek(0)

        # Set up the Http response.
        filename = f"employee-report-{employee.name}-{from_date.strftime('%Y-%m-%d')}_to_{to_date.strftime('%Y-%m-%d')}.xlsx"
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


class DeviceListView(PaginationMixin, ListView):
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
        if request.method == "POST":
            return self.delete(request, *args, **kwargs)
        return HttpResponseNotAllowed(["POST"])


class VacationsView(PaginationMixin, ListView):
    template_name = "attendance/vacations/vacations_list_view.html"
    model = Vacation
    paginate_by = 25

    def get_context_data(self, **kwargs):
        data = super().get_context_data(**kwargs)
        data["search_form"] = FilterVacationsForm(self.request.GET)
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
        return q.order_by('-date')

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
            new_balance = employee.current_vacations - ((to_date - date).days + 1)
            if new_balance < 0:
                SystemLog.objects.create(
                    user=self.request.user,
                    action="تحذير: رصيد إجازات غير كافٍ",
                    description=f"الموظف {employee.name} لا يملك رصيد كافٍ للإجازة. الرصيد الحالي: {employee.current_vacations}",
                    ip_address=self.request.META.get('REMOTE_ADDR')
                )
                # We still allow the vacation record, but don't deduct if it's strictly enforced.
                # Here we'll just not update the balance to avoid negative values.
            else:
                employee.current_vacations = new_balance
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
        if request.method == "POST":
            return self.delete(request, *args, **kwargs)
        return HttpResponseNotAllowed(["POST"])


class VacationTypeView(PermissionRequiredMixin, PaginationMixin, ListView):
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

    def get(self, request, *args, **kwargs):
        return HttpResponseNotAllowed(["POST"])

    def delete(self, request, *args, **kwargs):
        obj = self.get_object()
        SystemLog.objects.create(
            user=self.request.user,
            action="حذف نوع إجازة",
            description=f"تم حذف نوع الإجازة: {obj.name}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return super().delete(request, *args, **kwargs)


class ExceptionsView(PaginationMixin, ListView):
    template_name = "attendance/exceptions/exceptions_list_view.html"
    model = AttendanceException
    paginate_by = 25

    def get_queryset(self):
        q = super().get_queryset()
        g = self.request.GET
        if g.get('employees', "") != "":
            q = q.filter(employee_id=g.get('employees', None))
        if g.get('type', "") != "":
            q = q.filter(type=g.get('type', None))
        if g.get('date', "") != "":
            q = q.filter(date__gte=g.get('date', None))
        if g.get('to_date', "") != "":
            q = q.filter(date__lte=g.get('to_date', None))
        return q.order_by('-date')

    def get_context_data(self, **kwargs):
        data = super().get_context_data(**kwargs)
        data["search_form"] = FilterExceptionsForm(self.request.GET)
        return data

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class AddExceptionsView(PermissionRequiredMixin, FormView):
    template_name = "attendance/exceptions/add_edit_exception.html"
    form_class = AddExceptionForm
    model = AttendanceException
    success_url = reverse_lazy("Attendance:exception")
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True

    def form_valid(self, form):
        date = form.cleaned_data['date']
        exception_type = form.cleaned_data['type']
        employees = form.cleaned_data['employees']
        note = form.cleaned_data['note']
        for employee in employees:
            e = AttendanceException(employee=employee, date=date, type=exception_type, note=note)
            e.save()

        SystemLog.objects.create(
            user=self.request.user,
            action="إضافة استثناءات جماعية",
            description=f"تم إضافة استثناء {dict(AttendanceException.types).get(exception_type)} لعدد {employees.count()} موظف بتاريخ {date}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        return super().form_valid(form)


class DeleteExceptionView(PermissionRequiredMixin, DeleteView):
    permission_required = ('Attendance.can_create_employees',)
    raise_exception = True
    model = AttendanceException
    success_url = reverse_lazy("Attendance:exception")

    def get(self, request, *args, **kwargs):
        return HttpResponseNotAllowed(["POST"])

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
    model = AttendanceException
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

        total_emp_count = Employee.objects.count()
        present_count = WorkDay.objects.filter(date=today).values('employee').distinct().count()

        context['count_employees'] = total_emp_count
        context['count_presents'] = present_count
        context['count_permissions'] = AttendanceException.objects.filter(date=today).count()
        context['count_absents'] = max(0, total_emp_count - present_count)

        recent_date_limit = today - datetime.timedelta(days=30)

        # Late anomalies
        late_anomalies = Employee.objects.filter(
            active=True,
            workday__date__gte=recent_date_limit,
            workday__late_seconds__gt=0
        ).annotate(
            recent_late_count=Count('workday', distinct=True)
        ).filter(
            recent_late_count__gt=3
        ).values('id', 'name', 'recent_late_count').order_by('-recent_late_count')[:5]

        # Early exit anomalies
        early_exit_anomalies = Employee.objects.filter(
            active=True,
            workday__date__gte=recent_date_limit,
            workday__early_exit_seconds__gt=0
        ).annotate(
            recent_early_exit_count=Count('workday', distinct=True)
        ).filter(
            recent_early_exit_count__gt=3
        ).values('id', 'name', 'recent_early_exit_count').order_by('-recent_early_exit_count')[:5]

        context['late_anomalies'] = late_anomalies
        context['early_exit_anomalies'] = early_exit_anomalies

        # Enhanced weekly trend with work hours and early exit data
        weekly_trend = []
        for i in range(6, -1, -1):
            day = today - datetime.timedelta(days=i)
            presents = WorkDay.objects.filter(date=day).values('employee').distinct().count()
            pct = (presents / total_emp_count * 100) if total_emp_count > 0 else 0
            
            # Average work hours for present employees
            work_days = WorkDay.objects.filter(date=day)
            avg_work_hours = work_days.aggregate(avg_work=Avg('work_hours'))['avg_work'] or 0
            
            # Early exit count for the day
            early_exit_count = work_days.filter(early_exit_seconds__gt=0).count()
            
            weekly_trend.append({
                'day': day.strftime('%a'),
                'date': day.strftime('%Y-%m-%d'),
                'count': presents,
                'pct': round(pct, 1),
                'avg_work_hours': round(avg_work_hours, 1),
                'early_exit_count': early_exit_count
            })
        context['weekly_trend'] = weekly_trend

        month_start = today.replace(day=1)
        import json
        top_emps = Employee.objects.filter(active=True).select_related('default_profile')[:10]
        perf_labels = []
        perf_hours = []
        perf_lates = []
        perf_early_exit = []  # New series for early exit
        for emp in top_emps:
            emp.set_workdays(WorkDay.objects.filter(
                employee=emp, date__gte=month_start, date__lte=today
            ).select_related('employee__default_profile'))
            perf_labels.append(emp.name or emp.attendance_id)
            perf_hours.append(float(emp.count_hours))
            perf_lates.append(int(emp.late_days_count))
            perf_early_exit.append(int(emp.early_exit_min))  # Use the property we added

        context['perf_labels'] = json.dumps(perf_labels)
        context['perf_hours'] = json.dumps(perf_hours)
        context['perf_lates'] = json.dumps(perf_lates)
        context['perf_early_exit'] = json.dumps(perf_early_exit)

        # Today's early exit count
        context['count_early_exits'] = WorkDay.objects.filter(
            date=today, early_exit_seconds__gt=0
        ).values('employee').distinct().count()

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
            "active_employees": Employee.objects.filter(active=True).count(),
            "devices": ZKTDevice.objects.count(),
            "profiles": Profile.objects.count(),
            "vacation_types": VacationType.objects.count(),
            "exceptions": AttendanceException.objects.count(),
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
        employees = list(employee_queryset().select_related('default_profile'))
        workdays = list(WorkDay.objects.filter(
            Q(date__gte=from_date) & Q(date__lte=to_date) & Q(device=device)
        ).select_related('employee', 'employee__default_profile'))
        records = list(Record.objects.filter(
            Q(timestamp__gte=from_date) & Q(timestamp__lte=to_date) & Q(device=device)
        ).select_related('device'))
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
        employees = list(employee_queryset().select_related('default_profile'))
        workdays = list(WorkDay.objects.filter(
            Q(date__gte=from_date) & Q(date__lte=to_date) & Q(device=device)
        ).select_related('employee', 'employee__default_profile'))
        records = list(Record.objects.filter(
            Q(timestamp__gte=from_date) & Q(timestamp__lte=to_date) & Q(device=device)
        ).select_related('device'))
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


class ExportPayrollSummaryView(UserPassesTestMixin, View):
    raise_exception = True

    def test_func(self):
        return self.request.user.is_superuser

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
                v_start = max(v.date, from_date)
                v_end = min(v.to_date, to_date)
                vacation_days += (v_end - v_start).days + 1

            profile_days = [int(d.day) for d in profile.days.all()]
            required_days_val = required_days(from_date, to_date, profile=profile)

            accrued_days = present_days_count + vacation_days

            data = [
                emp.name,
                profile.name,
                round(total_work_hours, 2),
                late_days_count,
                vacation_days,
                round(overtime_hours, 2),
                overtime_days_count,
                required_days_val,
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


class UnifiedReportView(PermissionRequiredMixin, ListView):
    model = Employee
    template_name = "attendance/reports/unified_report.html"
    permission_required = ("Attendance.can_view_employees",)
    raise_exception = True
    paginate_by = 25

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        from_date, to_date = default_date_range(self)
        device = data_device(self)
        
        # Get employees with their workdays for the date range
        em = list(employee_queryset().select_related('default_profile'))
        wds = list(WorkDay.objects.filter(
            Q(date__gte=from_date) & Q(date__lte=to_date) & Q(device=device)
        ).select_related('employee', 'employee__default_profile'))
        rcs = list(Record.objects.filter(
            Q(timestamp__gte=from_date) & Q(timestamp__lte=to_date) & Q(device=device)
        ).select_related('device'))

        # Set records and workdays for each employee
        for e in em:
            e.set_records(rcs)
            e.set_workdays(wds)

        # Prepare employee data for the unified report
        employees_data = []
        total_presence = 0
        total_work_hours = 0
        total_overtime = 0
        total_late = 0
        total_early_exit = 0
        total_out_return = 0

        for emp in em:
            work_days = [wd for wd in emp.workdays if wd.date and from_date <= wd.date <= to_date]
            presence_days = len([wd for wd in work_days if wd.work > 0 or wd.overwork > 0 or wd.out_return_time > 0])
            
            emp_work_hours = sum(wd.work for wd in work_days)
            emp_overtime = sum(wd.overwork for wd in work_days)
            emp_late = sum(wd.late for wd in work_days) / 60  # Convert to minutes
            emp_early_exit = sum(wd.early_exit for wd in work_days) / 60  # Convert to minutes
            emp_out_return = sum(wd.out_return_time for wd in work_days)
            
            employees_data.append({
                'employee': emp,
                'presence_days': presence_days,
                'work_hours': round(emp_work_hours, 2),
                'overtime': round(emp_overtime, 2),
                'late_minutes': round(emp_late),
                'early_exit_minutes': round(emp_early_exit),
                'out_return_hours': round(emp_out_return, 2)
            })
            
            # Update totals
            total_presence += presence_days
            total_work_hours += emp_work_hours
            total_overtime += emp_overtime
            total_late += emp_late
            total_early_exit += emp_early_exit
            total_out_return += emp_out_return

        context['employees_data'] = employees_data
        context['date_from'] = from_date.strftime("%Y-%m-%d")
        context['date_to'] = to_date.strftime("%Y-%m-%d")
        context['device'] = device
        context['summary_totals'] = {
            'total_presence': total_presence,
            'total_work_hours': round(total_work_hours, 2),
            'total_overtime': round(total_overtime, 2),
            'total_late_minutes': round(total_late),
            'total_early_exit_minutes': round(total_early_exit),
            'total_out_return_hours': round(total_out_return, 2)
        }
        
        form = ReportFilterForm()
        form.initial['from_date'] = from_date.strftime("%Y-%m-%d")
        form.initial['to_date'] = to_date.strftime("%Y-%m-%d")
        context['form'] = form
        
        old_q = "&".join([f"{k}={v}" for k, v in self.request.GET.items() if k != "page"])
        context['old_q'] = old_q
        
        return context


class ExportUnifiedReportView(PermissionRequiredMixin, View):
    permission_required = ("Attendance.can_view_employees",)
    raise_exception = True

    def get(self, request, *args, **kwargs):
        from_date, to_date = default_date_range(self)
        device = data_device(self)

        em = list(employee_queryset().select_related('default_profile'))
        wds = list(WorkDay.objects.filter(
            Q(date__gte=from_date) & Q(date__lte=to_date) & Q(device=device)
        ).select_related('employee', 'employee__default_profile'))
        rcs = list(Record.objects.filter(
            Q(timestamp__gte=from_date) & Q(timestamp__lte=to_date) & Q(device=device)
        ).select_related('device'))

        for e in em:
            e.set_records(rcs)
            e.set_workdays(wds)

        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet()
        
        # Header format
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#1e293b',
            'font_color': 'white',
            'border': 1,
            'align': 'center',
            'valign': 'vcenter'
        })
        
        # Cell format
        cell_format = workbook.add_format({
            'border': 1,
            'align': 'center'
        })

        # Write headers
        headers = [
            "الاسم", "الرقم الوظيفي", "ايام الحضور", "ساعات العمل", 
            "ساعات الإضافي", "دقائق التأخير", "دقائق الخروج المبكر", "ساعات الخرج والعودة"
        ]
        
        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)
            worksheet.set_column(col, col, 18)

        # Write data
        for row_num, emp in enumerate(em, start=1):
            work_days = [wd for wd in emp.workdays if wd.date and from_date <= wd.date <= to_date]
            presence_days = len([wd for wd in work_days if wd.work > 0 or wd.overwork > 0 or wd.out_return_time > 0])
            
            emp_work_hours = sum(wd.work for wd in work_days)
            emp_overtime = sum(wd.overwork for wd in work_days)
            emp_late = sum(wd.late for wd in work_days) / 60  # Convert to minutes
            emp_early_exit = sum(wd.early_exit for wd in work_days) / 60  # Convert to minutes
            emp_out_return = sum(wd.out_return_time for wd in work_days)
            
            worksheet.write(row_num, 0, emp.name, cell_format)
            worksheet.write(row_num, 1, emp.attendance_id, cell_format)
            worksheet.write(row_num, 2, presence_days, cell_format)
            worksheet.write(row_num, 3, round(emp_work_hours, 2), cell_format)
            worksheet.write(row_num, 4, round(emp_overtime, 2), cell_format)
            worksheet.write(row_num, 5, round(emp_late), cell_format)
            worksheet.write(row_num, 6, round(emp_early_exit), cell_format)
            worksheet.write(row_num, 7, round(emp_out_return, 2), cell_format)

        workbook.close()
        output.seek(0)
        
        filename = f"unified-report-{from_date.strftime('%Y-%m-%d')}_to_{to_date.strftime('%Y-%m-%d')}.xlsx"
        response = HttpResponse(
            output,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename={filename}'
        
        SystemLog.objects.create(
            user=request.user,
            action="تحميل التقرير الموحد",
            description=f"تم تحميل التقرير الموحد للفترة من {from_date} إلى {to_date}",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return response
