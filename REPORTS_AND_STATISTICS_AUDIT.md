# Reports And Statistics Audit

Date: 2026-04-29
Project: `attendance`
Focus: reports, dashboard statistics, attendance relations, and monthly reporting readiness

## What I Checked

I reviewed the current report and statistics implementation in:

- [Attendance/views.py](/Users/zakaria/projects/antigravity/attendance/Attendance/views.py:215)
- [Attendance/models.py](/Users/zakaria/projects/antigravity/attendance/Attendance/models.py:89)
- [Attendance/forms.py](/Users/zakaria/projects/antigravity/attendance/Attendance/forms.py:103)
- [Attendance/urls.py](/Users/zakaria/projects/antigravity/attendance/Attendance/urls.py:1)
- [templates/attendance/reports/monthly_report.html](/Users/zakaria/projects/antigravity/attendance/templates/attendance/reports/monthly_report.html:1)
- [templates/attendance/reports/employee_report.html](/Users/zakaria/projects/antigravity/attendance/templates/attendance/reports/employee_report.html:1)
- [templates/attendance/reports/out_during_work.html](/Users/zakaria/projects/antigravity/attendance/templates/attendance/reports/out_during_work.html:1)
- [templates/attendance/dashboard.html](/Users/zakaria/projects/antigravity/attendance/templates/attendance/dashboard.html:1)

## Executive Status

The system has the beginning of a reporting module, but it is not yet customer-ready for a full attendance management workflow.

Current state:

- Core monthly summary report: `partially created`
- Employee detail report: `partially created`
- Dashboard statistics: `partially created`
- Vacation tracking in reports: `partially created`
- Late tracking in reports: `partially created`
- Exception and permission tracking in reports: `mostly not represented`
- Holiday and day-off tracking in reports: `broken / not completed`
- Printable monthly schedule: `not created`
- Downloadable monthly attendance matrix by day: `not created`

## Requirement Matrix

### 1. Raw attendance tracking

Status: `created, but depends on sync correctness`

Evidence:

- Records are stored in `Record`
- Workdays are grouped in `WorkDay`
- Reports read from `Record` and `WorkDay`

Notes:

- The reporting layer assumes the sync layer already built correct `WorkDay` rows.
- If sync misses same-day punches, the reports will be wrong even if the UI looks fine.

### 2. Lateness tracking

Status: `partially created`

Evidence:

- Late minutes are calculated from `WorkDay.late` and `Shift.late`
- Monthly report shows `employee.late_days_count`
- Employee report shows per-day late minutes
- Dashboard anomaly card shows recent late frequency

What works:

- The system can count late days.
- The system can show daily late minutes for one employee.

Problems:

- The monthly report only shows count of late days, not total late minutes or severity.
- The dashboard anomaly logic is very limited and checks only the first 50 employees.
- No late summary by month, department, or trend.

### 3. Vacation tracking

Status: `partially created`

Evidence:

- `Vacation` and `VacationType` models exist
- Monthly report shows `employee.vacations_count`
- Vacation CRUD views exist

What works:

- Vacation records can be created and counted.

Problems:

- Vacation counting is only based on date ranges and not clearly tied into attendance status per day.
- The main reports do not distinguish vacation type in summaries.
- The employee report does not show which days were vacations versus worked days.
- Vacation days are not rendered in a month calendar or a daily staff matrix.

### 4. Exceptions / permissions / approved lateness handling

Status: `partially created, poorly surfaced in reports`

Evidence:

- `Exception` model exists
- Exception CRUD views exist
- Dashboard shows a count of today's exceptions

What works:

- Exceptions can be stored.

Problems:

- Monthly report does not include exception totals.
- Employee report does not show which days were excused exceptions.
- There is no clean distinction in reporting between:
  - unexcused late
  - excused late
  - early exit
  - attendance permission
- The system has a manual `PermissionForm` built on `Record`, but it is not integrated into a complete reporting story.

### 5. Holidays and official day-off tracking

Status: `not working correctly`

Evidence:

- `Holiday` model exists in [Attendance/models.py](/Users/zakaria/projects/antigravity/attendance/Attendance/models.py:298)
- Monthly export writes `row.holidays_count` in [Attendance/views.py](/Users/zakaria/projects/antigravity/attendance/Attendance/views.py:293)
- `Employee.holidays_count` depends on `WorkDay.is_holiday`, but `WorkDay` has no `is_holiday` property

Verified failure:

- Accessing `Employee.holidays_count` raises:
  - `AttributeError: 'WorkDay' object has no attribute 'is_holiday'`

Impact:

- Holiday/day-off reporting is incomplete.
- Monthly export can fail when it tries to compute holidays.
- The system does not currently provide a reliable answer to "was this day a normal workday, weekend, holiday, vacation, absent, or excused?"

### 6. Extra work / overtime tracking

Status: `partially created`

Evidence:

- `ExtraWork` model exists
- `WorkDay.overwork` is calculated
- Employee report displays overtime

What works:

- Overtime hours can appear in the employee report.

Problems:

- The main monthly report does not show overtime as a first-class metric in the summary table.
- Extra work entries are not clearly merged into a complete monthly attendance picture.

### 7. Out during work tracking

Status: `partially created, but report is broken`

Evidence:

- Device mode `out_during_work` switches the report template
- [templates/attendance/reports/out_during_work.html](/Users/zakaria/projects/antigravity/attendance/templates/attendance/reports/out_during_work.html:97) displays `employee.out_return_count`

Verified issue:

- `Employee` does not define `out_return_count`

Impact:

- The out-during-work report template is incomplete and will not correctly provide the "number of times" metric.

### 8. Dashboard statistics

Status: `partially created`

Evidence:

- [templates/attendance/dashboard.html](/Users/zakaria/projects/antigravity/attendance/templates/attendance/dashboard.html:23)
- [Attendance/views.py](/Users/zakaria/projects/antigravity/attendance/Attendance/views.py:622)

What works:

- Total employees
- Present today
- Absent today
- Exceptions today
- Recent-late anomaly list
- Visual discipline rate card

Problems:

- These are basic counters, not deep statistics.
- There is no month-over-month trend, no department breakdown, no late-hours total, no vacation balance report, and no absenteeism rate by month.
- `count_absents` is derived by subtraction and may not reflect business rules like vacations, holidays, or approved exceptions.
- The dashboard presents a polished UI, but the underlying metrics are still simple.

### 9. Monthly summary report clarity and completeness

Status: `partially created`

Evidence:

- [templates/attendance/reports/monthly_report.html](/Users/zakaria/projects/antigravity/attendance/templates/attendance/reports/monthly_report.html:78)
- [Attendance/views.py](/Users/zakaria/projects/antigravity/attendance/Attendance/views.py:262)

What currently exists:

- A filterable monthly summary page
- A chart comparing work hours and late-day counts
- A table with:
  - employee
  - work hours
  - attendance days
  - late days
  - vacation days
- Excel export

Problems:

- The report is not complete for real attendance operations.
- It does not show absences explicitly.
- It does not show day-by-day statuses across the month.
- It does not show weekends, holidays, excused days, or leave types in one place.
- It does not show who came, who was late, who was absent, and why, on each day of the month.
- It is a summary report, not the monthly schedule grid the customer described.

### 10. Employee detail report clarity and completeness

Status: `partially created`

Evidence:

- [templates/attendance/reports/employee_report.html](/Users/zakaria/projects/antigravity/attendance/templates/attendance/reports/employee_report.html:102)
- [Attendance/views.py](/Users/zakaria/projects/antigravity/attendance/Attendance/views.py:312)

What currently exists:

- Per-employee date range report
- Daily rows with:
  - date
  - work hours
  - overtime
  - out/return time
  - late status
- Excel export

Problems:

- It only lists worked days returned by `employee.days()`
- It does not show missing days, absences, vacations, holidays, or approved exceptions in the daily table
- The card labeled `نسبة الحضور الفعلي` shows `object.all_days_count`, which is a count, not a percentage

Impact:

- The employee report is not a full attendance ledger.
- It cannot answer the full monthly question for a single employee without mental reconstruction.

### 11. Print-ready reporting

Status: `not created`

Evidence:

- No dedicated print route
- No print stylesheet found
- No `window.print()` integration found
- No PDF generation found

Impact:

- Reports may look good on screen, but they are not designed for formal printing.
- The customer requirement for clear printed month-to-month review is not met yet.

### 12. Downloadable monthly schedule of all month days

Status: `not created`

Customer need:

- A month-by-month schedule showing all days in the month
- For each employee, whether they:
  - came
  - were late
  - were absent
  - were on vacation
  - were on official day off / holiday
  - had an approved exception

What exists today:

- Summary export
- Employee day-summary export

What is missing:

- A calendar-style monthly matrix
- One column per day of the month
- A legend for attendance statuses
- A print-friendly version
- An Excel download built around a full month grid

Conclusion:

- This requirement is not implemented yet.

## Specific Report Bugs

### 1. Monthly export can break on holidays

Files:

- [Attendance/models.py](/Users/zakaria/projects/antigravity/attendance/Attendance/models.py:114)
- [Attendance/views.py](/Users/zakaria/projects/antigravity/attendance/Attendance/views.py:293)

Problem:

- The export writes `row.holidays_count`
- `holidays_count` calls `a.is_holiday`
- `WorkDay` has no `is_holiday`

Status: `broken`

### 2. Out-during-work report references a missing metric

Files:

- [templates/attendance/reports/out_during_work.html](/Users/zakaria/projects/antigravity/attendance/templates/attendance/reports/out_during_work.html:97)

Problem:

- `employee.out_return_count` is rendered in the template
- The property does not exist on `Employee`

Status: `incomplete`

### 3. Employee detail report hides absences

Files:

- [Attendance/models.py](/Users/zakaria/projects/antigravity/attendance/Attendance/models.py:139)
- [templates/attendance/reports/employee_report.html](/Users/zakaria/projects/antigravity/attendance/templates/attendance/reports/employee_report.html:125)

Problem:

- `employee.days()` filters to days where `len(a.shifts()) > 0`
- Days without shifts are excluded from the report entirely

Impact:

- A month report for one employee does not show all days of the month.
- The customer cannot see a complete attendance history from this report.

### 4. Summary report is attractive but not operationally complete

Files:

- [templates/attendance/reports/monthly_report.html](/Users/zakaria/projects/antigravity/attendance/templates/attendance/reports/monthly_report.html:78)

Problem:

- It is a KPI summary, not a real attendance register.

Impact:

- It does not satisfy the customer requirement for month-level inspection of all days.

## What Is Missing For The Customer Requirement

To meet the customer's request, the system still needs a dedicated monthly attendance register with:

1. One row per employee.
2. One column per day in the selected month.
3. A computed status for every employee-day:
   - present
   - late
   - absent
   - vacation
   - holiday / weekend
   - approved exception
   - out during work
4. Monthly totals at the end of each row:
   - present days
   - late days
   - absent days
   - vacation days
   - overtime hours
   - exception count
5. A legend and colors that remain readable in screen, print, and Excel export.
6. Download as Excel.
7. Print-friendly layout.

## My Recommendation

The next report to build should be:

`Monthly Attendance Register`

This should become the main customer-facing report, because it answers the actual operational question:

"For this whole month, for each employee, what happened on each day?"

That report should sit above the current summary report, not replace it. The current report is useful as a secondary analytics summary, but not as the main attendance control sheet.

## Next Step

Recommended implementation order:

1. Fix report-breaking bugs first:
   - `holidays_count` / missing `is_holiday`
   - missing `out_return_count`
   - employee report hiding absences
2. Define one normalized attendance status per employee-day.
3. Build a monthly matrix report page.
4. Add Excel export for that matrix.
5. Add print stylesheet and a print action.
6. Keep the current summary report as the dashboard-level analytic view.

## Bottom Line

The system can already summarize attendance, but it cannot yet reliably serve as a complete monthly attendance control and reporting system for the customer.

What is ready:

- summary KPIs
- basic monthly summary
- basic per-employee detail
- Excel export of summaries

What is not ready yet:

- full relation-aware attendance reporting
- holiday/day-off correctness
- complete exception-aware daily status
- printable monthly review
- downloadable month-by-day attendance schedule
