# HTI Attendance Management System

This project is a Django-based Employee Attendance and Biometric Device Management System. It connects to ZKTeco fingerprint/attendance devices, manages complex shift rules, and generates attendance reports.

## Architecture & Features

### 1. The Core Application: `Attendance`
This is the heart of the project and contains the most complex logic.
*   **Biometric Device Integration (`ZKTDevice`, `zkt.py`, `sync_records.py`)**: The system is designed to communicate with ZKTeco attendance devices over IP/Port. It syncs the punched fingerprint records (attendance logs) into the local database.
*   **Employee Management (`Employee`)**: Stores employee details and links them to their specific attendance device IDs and their default working shift profile.
*   **Shift & Rules Engine (`Profile`, `Shift`, `Day`)**: 
    *   `Profile` acts as a template for working hours, containing rules for allowed start/end times, shift boundaries, hourly modes, and overwork calculations.
    *   `Shift` class dynamically calculates whether an employee is late, working overtime, or leaving early by comparing their actual "punches" to their `Profile`.
*   **Attendance Tracking (`Record`, `WorkDay`)**:
    *   `Record`: Individual punches from the biometric device.
    *   `WorkDay`: Groups punches into a specific date to calculate total work time, overwork time, and "out and return" duration.
*   **Time Off & Exceptions (`Vacation`, `Holiday`, `Exception`, `ExtraWork`)**: Manages employee leaves, unexpected absences/lates, holidays, and extra approved work periods.
*   **Views & Reporting (`views.py`)**: Includes a web dashboard for adding/editing employees, devices, and profiles. Crucially, it has an `ExportReportView` and `ExportEmployeeReportView` that dynamically generates and downloads **Excel files (.xlsx)** containing attendance summaries (total hours, late days, vacations).
*   **API (`api_views.py`, `serializers.py`)**: Exposes REST API endpoints for this data.

### 2. The Authentication Application: `VIPAlert`
This app acts as the custom user authentication system.
*   **Custom User Model (`User`, `UserManager`)**: Overrides the default Django User to use `email` as the login credential instead of a username.
*   **Role Management**: Users can be assigned specific roles: `Admin`, `Technical`, or `Accountant` to manage access control.

### 3. The Main Project Configuration: `HTI`
*   **Settings (`settings.py`)**: 
    *   Configures the database (currently using `sqlite3`, but has commented-out code for `postgresql` / Heroku configuration).
    *   Sets timezone to `Africa/Cairo`.
    *   Configures Django REST Framework for API pagination and filtering.
    *   Sets the authentication user model to `VIPAlert.User`.
*   **Routing (`urls.py`)**: Maps `/accounts/` to the `VIPAlert` app, and the root `/` to the `Attendance` app.
