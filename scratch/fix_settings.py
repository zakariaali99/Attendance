with open('/Users/zakaria/projects/antigravity/attendance/HTI/settings.py', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "import os" in line:
        new_lines.append(line)
        new_lines.append("import sys\n")
    elif "BASE_DIR = Path(__file__).resolve().parent.parent" in line:
        new_lines.append("# BASE_DIR adjusted for PyInstaller\n")
        new_lines.append("if getattr(sys, 'frozen', False):\n")
        new_lines.append("    BASE_DIR = Path(sys._MEIPASS)\n")
        new_lines.append("else:\n")
        new_lines.append("    BASE_DIR = Path(__file__).resolve().parent.parent\n")
    elif "'NAME': os.path.join(BASE_DIR, 'db.sqlite3')," in line:
        new_lines.append("        # Persistent DB path for desktop mode\n")
        new_lines.append("        'NAME': os.path.join(os.path.dirname(sys.executable), 'db.sqlite3') if (getattr(sys, 'frozen', False) and os.environ.get('DESKTOP_MODE') == '1') else os.path.join(BASE_DIR, 'db.sqlite3'),\n")
    else:
        new_lines.append(line)

with open('/Users/zakaria/projects/antigravity/attendance/HTI/settings.py', 'w') as f:
    f.writelines(new_lines)
