# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['run_desktop.py'],
    pathex=[],
    binaries=[],
    datas=[('templates', 'templates'), ('static', 'static'), ('logos', 'logos'), ('db.sqlite3', '.'), ('Attendance', 'Attendance'), ('VIPAlert', 'VIPAlert'), ('HTI', 'HTI'), ('manage.py', '.')],
    hiddenimports=['django.contrib.admin', 'django.contrib.auth', 'django.contrib.contenttypes', 'django.contrib.sessions', 'django.contrib.messages', 'django.contrib.staticfiles', 'VIPAlert.apps', 'Attendance.apps', 'rest_framework', 'widget_tweaks', 'django_filters', 'environ'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['matplotlib', 'numpy', 'scipy', 'pandas', 'pyarrow', 'streamlit', 'jupyter', 'notebook', 'IPython', 'ipykernel', 'ipywidgets', 'qtconsole', 'nbconvert', 'nbformat', 'nbclient', 'sklearn', 'nltk', 'textblob', 'moviepy', 'imageio', 'selenium', 'flask', 'sqlalchemy', 'alembic', 'tkinter', 'test', 'unittest'],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='AlKhawarizmiAttendance',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['logos/icon_logo.png'],
)
app = BUNDLE(
    exe,
    name='AlKhawarizmiAttendance.app',
    icon='logos/icon_logo.png',
    bundle_identifier=None,
)
