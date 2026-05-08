Implementation Plan: Unified Report & Enhanced Dashboard Charts
Recreate the report page to show all key metrics in one place and fix/improve dashboard visualizations.

User Review Required
IMPORTANT

Unified Report Metrics: I will include: Total Presence, Total Work Hours, Total Overtime, Total Late (Delay), Total Early Exit, and Total Out/Return (Go back & return).
Chart.js Dependency: Since the library is currently missing from offline assets, I will attempt to restore it or use a CDN fallback that works reliably.
Migration: Adding early_exit_seconds to the WorkDay model will require a database migration to ensure performance when generating reports.
Proposed Changes
[Attendance] Core Logic & Models
[MODIFY] 
models.py
Implement the early property in the Shift class to calculate seconds left before the official shift end.
Add early_exit_seconds field to WorkDay model.
Update WorkDay.update_totals() to calculate and save early_exit_seconds.
[MODIFY] 
views.py
Create UnifiedReportView: A new ListView for employees that aggregates all metrics (Work, Overtime, Late, Early Exit, Out/Return) for a date range.
Create ExportUnifiedReportView: Excel export functionality for the unified report.
Enhance DashboardView:
Improve weekly_trend to show more detail.
Update performanceChart data to show a better comparison (e.g., Attendance Rate vs Work Hours).
Ensure all data is JSON-serialized correctly for the frontend.
[MODIFY] 
urls.py
Register /report/unified/ and /report/unified/export/.
[Templates] UI/UX Enhancements
[NEW] 
unified_report.html
A new template with a comprehensive table.
Use DataTables for sorting, searching, and pagination.
Add a summary card at the top for totals.
[MODIFY] 
dashboard.html
Restore Chart.js initialization logic.
Implement more attractive chart styles (gradients, custom tooltips).
Add better handling for "No Data" states.
[MODIFY] 
base.html
Ensure Chart.js is correctly included (either local or reliable CDN).
Verification Plan
Automated Tests
Run python manage.py test Attendance to ensure no regressions in existing models.
Create a temporary script to verify the new early_exit_seconds calculation.
Manual Verification
Unified Report:
Navigate to the new report page.
Change date range and verify metrics update.
Click "Export to Excel" and check the downloaded file.
Dashboard:
Verify charts render correctly in both Light and Dark modes.
Check that the sync button still works.
Verify "Live Date Time" and counters are animating.