# Al-Khawarizmi Attendance System

Based on the system architecture and database models, here is a comprehensive description of the **Al-Khawarizmi Attendance System**. You can use this document to inform your UI/UX design process, identify the necessary screens, and map out user flows.

## 1. High-Level System Overview
The system is a centralized workforce and attendance tracking platform built with Django. Its primary purpose is to integrate with ZKTeco biometric devices (fingerprint/face scanners) to capture employee punches. It processes these raw records against configured shift rules ("Profiles") to automatically calculate worked hours, lateness, overtime, and early exits. It also accommodates manual interactions like assigning vacations, logging extra work, and system configuration by various department roles.

---

## 2. Core Entities (Data Models)

*   **Employee:** The central entity. They have a basic profile (Name, Phone), a unique `attendance_id` assigned by the hardware device, a designated `ZKTDevice`, and a default `Profile` (which dictates their shift hours).
*   **Profile (Shifts/Schedules):** Highly configurable shift templates. They contain data on expected start/end times, *allowed* start/end times (grace periods), overtime logic, and behaviors for overnight shifts.
*   **ZKTDevice:** Represents the physical biometric machines on the factory floor or office. It logs IP, Port, and specific rules like whether an exit punch during work hours counts as an "out" or is ignored.
*   **Record (Punches):** Raw, unprocessed raw time data synced directly from the devices (timestamps, user IDs).
*   **WorkDay & Shift:** Calculated entities. The system aggregates raw `Records` to dynamically generate daily `Shifts`, marking the time blocks as *working hours*, *overwork*, *late*, or *out*.
*   **Exceptions/Vacations/ExtraWork:** Modules for managing deviations. Includes holiday definitions, vacation date ranges tied to specific "Vacation Types" (e.g., Annual, Sick), automatically flagged Exceptions (like arriving late or leaving early), and manual Extra Work logging.
*   **Users & Roles (VIPAlert App):** Staff members accessing the web system. Roles are split into Admin, Technical (hardware management), and Accountant (payroll/reporting), which dictates their permissions on the dashboard.

---

## 3. Key Modules and Required Dashboard Screens

For a complete UI/UX overhaul, the application interfaces should consist of the following primary screens and workflows:

### A. Main Dashboard
*   **Overview:** High-level statistics.
*   **Key Elements:** Today's attendance summary (Present vs. Absent counts), recent system alerts (e.g., disconnected devices, excessive lateness flags), and quick-action buttons (e.g., "Sync Devices", "Add New Employee").

### B. Employee Management 
*   **Employee List View:** A data-rich table displaying all registered employees, their current operational status, device assignment, and default profile. Needs filtering (e.g., by active status or shift type).
*   **Employee Detail/Edit View:** A split view or tabbed interface. One side contains editable form fields (Phone, default profile, permissions). Another section displays a micro-report of their recent attendance `Records`.

### C. Schedule & Profiles Configuration
*   **Profile List:** Cards or table rows outlining all defined shifts.
*   **Profile Configuration Form:** This is a complex UX challenge. It requires an interface to handle times (Start time, Shift time, Allowed grace periods, Overtime limits). It's best designed by grouping fields logically (e.g., "Core Hours", "Overtime Rules", "Grace Periods") rather than a single massive form block.

### D. Device Synchronization & Management
*   **Hardware Grid:** Status of connected ZKTeco machines displaying IP and connection status.
*   **Action UI:** Buttons to trigger manual IP-based syncs to pull hardware records into the central database, showing clear loading/progress states.

### E. Time-Off & Exception Management
*   **Vacation & Holiday Matrix:** A calendar or list view showing overlapping employee absences. Includes an interface to add new leaves mapped to predefined `Vacation Types`.
*   **Exceptions Grid:** A review queue for automatically flagged late entries or early exits, allowing an Admin/Accountant to clear or annotate them.
*   **Extra Work Tracker:** Management view for assigning overriding extra-work hours.

### F. Reports & Exporting
*   **Periodical UI:** A robust sidebar or top-bar filter (by Date Range, Profile, or specific Employee).
*   **Data Preview:** An on-screen ledger displaying calculated metrics output (Base hours, Lateness penalty, Overtime accrued).
*   **Export Actions:** Clear UI hooks to generate PDF or Excel dumps.

---

## 4. UI/UX Design Advice & Heuristics

1.  **Status Color Language:** Attendance systems rely heavily on scannability. 
    *   `Present/In` -> Success Colors (Green/Emerald).
    *   `Absent/Missing` -> Danger Colors (Red/Rose).
    *   `Late/Early Exit` -> Warning Colors (Amber/Orange).
    *   `Overwork/Extra` -> Info Colors (Blue/Indigo).
2.  **Handling Tables:** Since this is a data-heavy HR tool, ensure tables utilize sticky headers, sticky action-columns, pagination, and persistent search/filter inputs. 
3.  **Surfacing Calculated Data:** Designers should note that the back-end automatically calculates "Shifts" (e.g., turning raw biometric punches into "8 hours worked, 1 hour late"). The UI should lean on surfacing these calculated, human-readable states cleanly rather than just dumping raw timestamp numbers on the user.
