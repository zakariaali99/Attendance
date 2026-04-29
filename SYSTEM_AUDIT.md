# System Audit

Date: 2026-04-28
Project: `attendance`

## Scope

I scanned the Django project structure, settings, models, forms, views, sync logic, and auth code. I also ran:

```bash
python3 manage.py check
python3 manage.py test
```

Result:

- `manage.py check`: passed
- `manage.py test`: passed, but there are `0` tests

## Verified Bugs And Mistakes

### 1. Permission checks are declared but not enforced on many Attendance views

Files:

- [Attendance/views.py](/Users/zakaria/projects/antigravity/attendance/Attendance/views.py:80)

Problem:

- Many classes set `permission_required`, but they do not inherit `PermissionRequiredMixin` or `LoginRequiredMixin`.
- In Django, the attribute alone does nothing.
- This leaves employee creation, editing, reports, devices, vacations, exceptions, and exports exposed to any user who can reach those URLs.

Examples:

- `AddEmployeeView`
- `SyncDevicesView`
- `EditEmployeeView`
- `EmployeeView`
- `EmployeeRecordsView`
- `AddVacationsView`
- `EditVacationView`
- `AddExceptionsView`
- `EditExceptionView`

Fix:

- Make protected views inherit `PermissionRequiredMixin`.
- Add `LoginRequiredMixin` where authentication alone is required.
- Set `raise_exception = True` or configure a clear login redirect.

### 2. User creation and editing pages are not permission-protected

Files:

- [VIPAlert/views.py](/Users/zakaria/projects/antigravity/attendance/VIPAlert/views.py:50)

Problem:

- `AddUserView` and `EditUserView` only check `request.user.is_authenticated` in `get()`.
- Any logged-in user can open user-management pages and potentially create or edit accounts.

Fix:

- Add `PermissionRequiredMixin` to both views.
- Require `VIPAlert.can_create_users` for create and `VIPAlert.can_edit_users` for edit.
- Protect `post()` as well by relying on the mixin instead of only guarding `get()`.

### 3. `create_superuser()` does not create a superuser

Files:

- [VIPAlert/models.py](/Users/zakaria/projects/antigravity/attendance/VIPAlert/models.py:31)

Verified behavior:

- Running `User.objects.create_superuser(...)` produced:
  - `is_superuser=False`
  - `is_staff=True`
  - `is_admin=True`

Problem:

- The custom manager only sets `is_admin=True`.
- It never sets `is_superuser=True`.
- This breaks Django’s expected superuser behavior and can cause privilege confusion.

Fix:

- Update `create_superuser()` to explicitly set:
  - `is_superuser = True`
  - `is_staff = True`
  - `is_admin = True`
- Add validation so a misconfigured superuser cannot be created.

### 4. `WorkDay.shifts()` can crash with `TypeError: object of type 'filter' has no len()`

Files:

- [Attendance/models.py](/Users/zakaria/projects/antigravity/attendance/Attendance/models.py:498)

Verified behavior:

- `len(filter(...))` raises a `TypeError` on Python 3.

Problem:

- The code uses `len(exceptions)` where `exceptions` is a `filter` object.
- This will crash when the single-record branch is executed.

Fix:

- Replace `filter(...)` with a list comprehension or wrap it with `list(...)` before calling `len()`.

### 5. `Record.status` has an invalid default value

Files:

- [Attendance/models.py](/Users/zakaria/projects/antigravity/attendance/Attendance/models.py:208)

Verified behavior:

- `full_clean()` rejects the default with:
  - `"attendance" is not a valid choice`

Problem:

- `status` choices are only `early_exit` and `late`, but the default is `"attendance"`.
- This causes validation failures and inconsistent data semantics.

Fix:

- Either add `"attendance"` to `attendance_choices`, or change the default to `None` or one of the allowed values.
- If normal records are expected, `"attendance"` should be added as an explicit choice.

### 6. Vacation filtering uses the wrong query parameter name

Files:

- [Attendance/views.py](/Users/zakaria/projects/antigravity/attendance/Attendance/views.py:407)

Problem:

- The code checks `vacation_type` in the query string, but filters using `g.get('type', None)`.
- That means the vacation type filter silently fails.

Fix:

- Use the same parameter name for both the presence check and the filter value.
- Example: `q = q.filter(vacation_type_id=g.get('vacation_type'))`

### 7. Incremental record sync skips new punches on the latest processed day

Files:

- [Attendance/sync_records.py](/Users/zakaria/projects/antigravity/attendance/Attendance/sync_records.py:23)

Problem:

- The sync only loads records with `timestamp__date__gt=workday.date`.
- New records that arrive later on the same day are ignored forever.

Impact:

- Late punches, end-of-day punches, and corrected same-day imports can be missed.

Fix:

- Reprocess the latest known day with `>=` logic or track the last processed record timestamp instead of only the date.

### 8. Workday duplicate detection ignores device

Files:

- [Attendance/sync_records.py](/Users/zakaria/projects/antigravity/attendance/Attendance/sync_records.py:55)

Problem:

- Duplicate prevention checks only `employee` and `date`.
- If the same employee uses more than one device, one device can block valid workday creation for another.

Fix:

- Include `device=device` in the existence check if workdays are device-specific.
- If workdays should be cross-device, then the rest of the reporting logic should also stop filtering by device so the model is consistent.

### 9. Static asset URL configuration is inconsistent

Files:

- [HTI/settings.py](/Users/zakaria/projects/antigravity/attendance/HTI/settings.py:157)
- [HTI/urls.py](/Users/zakaria/projects/antigravity/attendance/HTI/urls.py:11)

Problem:

- `STATIC_URL` is `/vip/static/`
- URL routing serves static files from `/static/...`
- That mismatch can break CSS and JS unless a separate reverse proxy is rewriting paths.

Fix:

- Make `STATIC_URL` and the served route match.
- The usual Django value is `/static/`.

### 10. Production secrets and unsafe debug settings are committed in source

Files:

- [HTI/settings.py](/Users/zakaria/projects/antigravity/attendance/HTI/settings.py:25)

Problem:

- `SECRET_KEY` is hardcoded
- `DEBUG = True`
- `ALLOWED_HOSTS = ['*']`
- `CORS_ORIGIN_ALLOW_ALL = True`
- Old database credentials are left in comments

Impact:

- This is a serious deployment and security risk.

Fix:

- Move secrets and environment-specific config to environment variables.
- Remove old credentials from source control.
- Lock `ALLOWED_HOSTS` and CORS down for production.

## Gaps That Increase Risk

### No automated test coverage

Files:

- [Attendance/tests.py](/Users/zakaria/projects/antigravity/attendance/Attendance/tests.py:1)

Problem:

- `python3 manage.py test` reports `0` tests.
- Regressions in attendance calculations, permissions, and sync logic will be easy to ship unnoticed.

Fix:

- Add focused tests first for:
  - auth and permissions
  - `WorkDay.shifts()`
  - sync behavior for same-day punches
  - report filters

## My Opinion

The next thing this system should create is not a new screen. It should create a safety layer:

1. A minimal regression test suite for auth, sync, and attendance calculations.
2. A proper environment-based settings setup for production and development.
3. A clear permission map for every management view.

Right now the biggest risk is not missing UI polish. It is silent incorrect behavior in attendance data plus accidental overexposure of admin features.

## Next Step

Recommended next step:

1. Fix permissions on all protected views.
2. Fix `create_superuser()`.
3. Fix `WorkDay.shifts()` filter handling.
4. Fix `Record.status` choices/default.
5. Add 4-6 smoke tests covering those paths.

If we do only one small phase next, it should be a "stabilization pass" focused on auth and attendance correctness before adding new features.
