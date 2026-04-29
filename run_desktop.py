import os
import sys
import threading
import time
import socket
import webview
from django.core.management import execute_from_command_line

# Helper for PyInstaller paths
def resource_path(relative_path):
    \"\"\" Get absolute path to resource, works for dev and for PyInstaller \"\"\"
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'HTI.settings')
os.environ['DESKTOP_MODE'] = '1'

def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def start_django():
    \"\"\"Run Django server in a background thread.\"\"\"
    try:
        # In a bundled app, manage.py is in the resource path
        manage_py = resource_path('manage.py')
        execute_from_command_line([manage_py, 'runserver', '127.0.0.1:8000', '--noreload'])
    except Exception as e:
        print(f"Django error: {e}")

def main():
    # 1. Start Django in a daemon thread
    django_thread = threading.Thread(target=start_django, daemon=True)
    django_thread.start()

    # 2. Wait for the server to be ready
    retries = 20
    while not is_port_open(8000) and retries > 0:
        print("Waiting for Django to start...")
        time.sleep(1)
        retries -= 1

    if retries == 0:
        print("Failed to start Django server.")
        sys.exit(1)

    # 3. Create the webview window
    icon_path = resource_path(os.path.join('logos', 'icon_logo.png'))
    
    window = webview.create_window(
        'منظومة الخوارزمي - Al-Khawarizmi System',
        'http://127.0.0.1:8000',
        width=1280,
        height=800,
        min_size=(1024, 768),
        confirm_close=True,
    )

    # 4. Start the GUI
    webview.start(debug=False)

if __name__ == '__main__':
    main()
