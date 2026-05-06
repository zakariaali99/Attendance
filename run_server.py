import os
import sys
from waitress import serve
from HTI.wsgi import application

# Adjusting path for potential PyInstaller environment
if getattr(sys, 'frozen', False):
    os.environ['DESKTOP_MODE'] = '1'

# Port configuration:
# - DESKTOP_MODE=1 (Electron): uses port 8765 (default)
# - NSSM/traditional: uses port 8000
# Override with PORT environment variable
PORT = int(os.environ.get('PORT', 8765 if os.environ.get('DESKTOP_MODE') == '1' else 8000))
HOST = os.environ.get('HOST', '0.0.0.0')

if __name__ == '__main__':
    print("=" * 50)
    print("Al-Khwarizmi Attendance System")
    print(f"Starting on http://localhost:{PORT}")
    print("Press Ctrl+C to stop.")
    print("=" * 50)
    
    # Run the production server
    serve(application, host=HOST, port=PORT, threads=4)
