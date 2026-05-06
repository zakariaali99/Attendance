import os
import sys
from waitress import serve
from HTI.wsgi import application

# Adjusting path for potential PyInstaller environment
if getattr(sys, 'frozen', False):
    os.environ['DESKTOP_MODE'] = '1'

if __name__ == '__main__':
    print("=" * 50)
    print("Al-Khwarizmi Attendance System")
    print("Starting on http://localhost:8765")
    print("Press Ctrl+C to stop.")
    print("=" * 50)
    
    # Run the production server
    serve(application, host='127.0.0.1', port=8765, threads=4)
