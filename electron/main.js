const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'info';
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log');

log.info('Application starting...');

// Global reference to prevent garbage collection
let mainWindow = null;
let pythonProcess = null;
const PYTHON_PORT = 8765;
const APP_URL = `http://localhost:${PYTHON_PORT}`;

// Single instance lock - focus existing window if already running
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    log.info('Another instance is already running. Quitting.');
    app.quit();
} else {
    app.on('second-instance', () => {
        // Focus the existing window when user tries to open another instance
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

// Check if Python process is running
function isPythonRunning() {
    return new Promise((resolve) => {
        exec('netstat -ano | findstr :8765', (error, stdout) => {
            resolve(stdout.includes('8765'));
        });
    });
}

// Wait for server to be ready
async function waitForServer(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const response = await fetch(APP_URL);
            if (response.ok) {
                log.info(`Server ready after ${i + 1} attempts`);
                return true;
            }
        } catch (e) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    return false;
}

// Kill existing Python processes on this port
function killExistingProcesses() {
    return new Promise((resolve) => {
        exec('for /f "tokens=5" %a in (\'netstat -ano ^| findstr :8765 ^| findstr LISTENING\') do taskkill /F /PID %a', 
            (error) => {
                log.info('Cleaned up existing processes');
                resolve();
            });
    });
}

// Start Python Django server
async function startPythonServer() {
    log.info('Starting Django server...');
    
    // Kill any existing processes first
    await killExistingProcesses();
    
    // Small delay to ensure port is released
    await new Promise(r => setTimeout(r, 500));
    
    const exePath = app.isPackaged 
        ? path.join(process.resourcesPath, 'app', 'build', 'run_server.exe')
        : path.join(__dirname, 'build', 'run_server.exe');
        
    const appPath = app.isPackaged
        ? path.join(process.resourcesPath, 'app', 'build')
        : __dirname;

    log.info(`Executable path: ${exePath}`);
    log.info(`App path: ${appPath}`);

    try {
        pythonProcess = spawn(exePath, [], {
            cwd: appPath,
            detached: true,
            stdio: 'ignore',
            shell: true
        });
        
        pythonProcess.unref();
        
        log.info('Python process spawned');
        
        // Wait for server to be ready
        const serverReady = await waitForServer(30);
        
        if (serverReady) {
            log.info('Django server is ready');
            return true;
        } else {
            log.error('Django server failed to start');
            return false;
        }
    } catch (err) {
        log.error('Failed to start Python:', err);
        return false;
    }
}

// Create the main window
function createWindow() {
    log.info('Creating main window...');
    
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        show: false, // Show after ready-to-show
        backgroundColor: '#fcf8fb',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true,
            allowRunningInsecureContent: false
        },
        // Use default frame (native Windows title bar)
        frame: true,
        titleBarStyle: 'default'
    });

    // Load the Django app
    mainWindow.loadURL(APP_URL);

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        log.info('Window is now visible');
    });

    // Handle window close
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Log any load failures
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        log.error(`Failed to load: ${errorCode} - ${errorDescription}`);
    });

    mainWindow.webContents.on('crashed', (event, killed) => {
        log.error(`Renderer process crashed. Killed: ${killed}`);
    });
}

// App ready
app.whenReady().then(async () => {
    log.info('App is ready');
    
    // Start the Django server
    const serverStarted = await startPythonServer();
    
    if (serverStarted) {
        createWindow();
    } else {
        log.error('Cannot start server, exiting...');
        app.quit();
    }
});

// Quit when all windows are closed (Windows specific)
app.on('window-all-closed', () => {
    log.info('All windows closed');
    if (pythonProcess) {
        try {
            process.kill(-pythonProcess.pid);
        } catch (e) {
            log.error('Error killing python process:', e);
        }
    }
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled rejection at:', promise, 'reason:', reason);
});