import os
import sys
import subprocess
import platform

def build():
    # 1. Configuration
    app_name = "AlKhawarizmiAttendance"
    entry_point = "run_desktop.py"
    icon_file = "logos/app_icon.ico" if platform.system() == "Windows" else "logos/icon_logo.png"
    
    # 2. Data files to include (format: 'source;destination' on Windows, 'source:destination' on others)
    separator = ";" if platform.system() == "Windows" else ":"
    data_files = [
        f"templates{separator}templates",
        f"static{separator}static",
        f"logos{separator}logos",
        f"db.sqlite3{separator}.",
        f"Attendance{separator}Attendance",
        f"VIPAlert{separator}VIPAlert",
        f"HTI{separator}HTI",
        f"manage.py{separator}.",
    ]

    # 3. Build command
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name", app_name,
        "--windowed",  # No console window
        "--onefile",  # Bundle into a single executable
        "--clean",
        f"--icon={icon_file}",
    ]

    for data in data_files:
        cmd.extend(["--add-data", data])

    # 4. Hidden imports (Django often needs these)
    hidden_imports = [
        "django.contrib.admin",
        "django.contrib.auth",
        "django.contrib.contenttypes",
        "django.contrib.sessions",
        "django.contrib.messages",
        "django.contrib.staticfiles",
        "VIPAlert.apps",
        "Attendance.apps",
        "rest_framework",
        "widget_tweaks",
        "django_filters",
        "environ",
    ]
    for imp in hidden_imports:
        cmd.extend(["--hidden-import", imp])

    # 5. Exclude heavy packages not needed by the Django web app
    exclude_modules = [
        "matplotlib", "numpy", "scipy", "pandas", "pyarrow",
        "streamlit", "jupyter", "notebook", "IPython", "ipykernel",
        "ipywidgets", "qtconsole", "nbconvert", "nbformat", "nbclient",
        "sklearn", "nltk", "textblob", "moviepy", "imageio",
        "selenium", "flask", "sqlalchemy", "alembic",
        "tkinter", "test", "unittest",
    ]
    for mod in exclude_modules:
        cmd.extend(["--exclude-module", mod])

    cmd.append(entry_point)

    print(f"Running build command: {' '.join(cmd)}")
    subprocess.run(cmd)

if __name__ == "__main__":
    build()
