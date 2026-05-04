import os
import sys
from waitress import serve
from HTI.wsgi import application

# Adjusting path for potential PyInstaller environment
if getattr(sys, 'frozen', False):
    os.environ['DESKTOP_MODE'] = '1'

if __name__ == '__main__':
    print("Starting Al-Khwarizmi Attendance System on http://localhost:8000")
    print("Press Ctrl+C to stop.")
    
    # Run the production server
    serve(application, host='0.0.0.0', port=8000, threads=4)
