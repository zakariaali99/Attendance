# How to Run - Al-Khwarizmi Attendance Desktop App

## Overview

This guide provides two methods to run the Al-Khwarizmi Attendance System:

1. **Desktop App (Electron)** - Run as a native Windows desktop application
2. **Windows Service (NSSM)** - Run as a Windows background service

---

## Method 1: Desktop App (Electron) [RECOMMENDED]

### Requirements

1. **Python 3.11+** - Must be installed
2. **Node.js 18+** - Required for building
3. **PyInstaller** - Will be installed automatically during build

### Step-by-Step Instructions

#### Step 1: Check Requirements

Open CMD and run:

```cmd
python --version
node --version
npm --version
```

If any are missing, install from:
- Python: https://www.python.org/downloads/
- Node.js: https://nodejs.org/

#### Step 2: Clone the Code

```cmd
git clone https://github.com/zakariaali99/testAttendance.git
cd testAttendance
```

#### Step 3: Build the Application

```cmd
cd electron
build-app.bat
```

You'll see:
```
[1/5] Installing Python dependencies...
[2/5] Building Django executable with PyInstaller...
[3/5] Copying built files to electron/build...
[4/5] Installing Node.js dependencies...
[5/5] Building Electron app...
Build Complete!
```

#### Step 4: Run the Installer

After building, find the installer at:
```
electron/dist/Al-Khwarizmi-Attendance-Setup.exe
```

Run it and follow the installation wizard.

#### Step 5: Launch the App

After installation, find:
- Desktop shortcut: "Al-Khwarizmi Attendance"
- Start Menu: "Al-Khwarizmi Attendance"

---

## Method 2: Windows Service (NSSM)

### Requirements

1. **Python 3.11+**
2. **NSSM** - Windows Service Manager tool

### Step-by-Step Instructions

#### Step 1: Download NSSM

1. Go to: https://nssm.cc/download
2. Download latest version (nssm-2.24.zip)
3. Extract and copy `nssm.exe` to project folder or add to PATH

#### Step 2: Configure Python Path

Open `setup_service.bat` and edit:
```batch
set PYTHON_PATH=C:\path\to\your\python.exe
```
Replace with your actual Python path.

#### Step 3: Install the Service

```cmd
setup_service.bat
```

#### Step 4: Start the Service

```cmd
nssm start AlKhwarizmiAttendance
```

#### Step 5: Access the System

Open browser:
```
http://localhost:8000
```

---

## Comparison

| Feature | Electron (Desktop) | NSSM (Service) |
|---------|-------------------|----------------|
| Interface | Native desktop app | Web browser |
| Launch | Desktop shortcut | System service |
| Port | 8765 | 8000 |
| Installation | EXE installer | NSSM setup |
| Updates | Reinstall | Code update |

---

## Troubleshooting

### "Python not found"
→ Ensure Python is installed and in PATH

### "Node.js not found"
→ Install from nodejs.org

### "Port already in use"
→ Close other applications using the same port

### Service won't start
→ Check Event Viewer for errors:
```cmd
eventvwr
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8000 (NSSM) / 8765 (Electron) |
| `HOST` | Host address | 0.0.0.0 |
| `DEBUG` | Debug mode | False |
| `DESKTOP_MODE` | Desktop mode | 1 (Electron) / 0 (NSSM) |

---

## For Developers

### Running in Development Mode

```cmd
cd electron
npm run dev
```

### Building Only the Python Part

```cmd
cd ..
pyinstaller run_server.spec
```

### Rebuilding Electron Only

```cmd
cd electron
npm run build
```

---

## Files Structure

```
electron/
├── package.json          # Electron config
├── main.js               # Main process
├── preload.js            # Preload script
├── build-app.bat         # Build script
├── start-app.bat         # Launch script
├── run_server.spec       # PyInstaller config
├── How to Run (Arabic).md
├── How to Run.md
└── build/                # Built files (after build)
    └── dist/             # Final executables
```

---

## Support

For questions or issues:
- See PRODUCTION_DEPLOYMENT.md
- Check logs in electron/logs/