const { app, BrowserWindow, Tray, Menu, ipcMain, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Global error handling to catch startup crashes
process.on('uncaughtException', (error) => {
    const logPath = path.join(app.getPath('userData'), 'error.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] Uncaught Exception: ${error.stack}\n`);
    dialog.showErrorBox('Startup Error', `The application failed to start:\n${error.message}\n\nLogs saved to: ${logPath}`);
    app.quit();
});

// Core Modules
let localDetector, geminiDetector, dbManager;
try {
    localDetector = require('./core/local-detector');
    geminiDetector = require('./core/gemini-detector');
    dbManager = require('./core/db-manager');
} catch (err) {
    dialog.showErrorBox('Module Load Error', `Failed to load core modules:\n${err.message}`);
    process.exit(1);
}

let mainWindow;
let mainTray;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 380,
        height: 140,
        show: false,
        frame: false,
        resizable: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile('renderer/index.html');

    // Position in bottom right
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setPosition(width - 390, height - 150);

    mainWindow.once('ready-to-show', () => {
        // Automatically show on first run to confirm it works
        mainWindow.show();
        // Optionnel: masquer après quelques secondes
        // setTimeout(() => mainWindow.hide(), 5000);
    });
}

function createTray() {
    try {
        const iconPath = path.join(__dirname, 'assets/icon.png');
        if (!fs.existsSync(iconPath)) {
            console.error('Tray icon not found at:', iconPath);
        }
        mainTray = new Tray(iconPath); 
        
        const contextMenu = Menu.buildFromTemplate([
            { label: 'VerseID - BibleBar', enabled: false },
            { type: 'separator' },
            { label: 'Afficher / Masquer', click: () => toggleWindow() },
            { type: 'separator' },
            { label: 'Historique', click: () => {} },
            { label: 'Paramètres', click: () => {} },
            { type: 'separator' },
            { label: 'Quitter', click: () => app.quit() }
        ]);

        mainTray.setToolTip('VerseID - BibleBar');
        mainTray.setContextMenu(contextMenu);

        mainTray.on('click', () => {
            toggleWindow();
        });
    } catch (err) {
        console.error('Failed to create tray:', err);
    }
}

function toggleWindow() {
    if (mainWindow.isVisible()) {
        mainWindow.hide();
    } else {
        mainWindow.show();
    }
}

app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('get-api-key', () => process.env.GEMINI_API_KEY);

ipcMain.handle('detect-verse', async (event, text) => {
    try {
        // 1. Local Detection
        let result = localDetector.detect(text);
        if (result) return { ...result, mode: 'OFFLINE' };

        // 2. Gemini Fallback
        result = await geminiDetector.detect(text);
        if (result) return { ...result, mode: 'GEMINI' };

        return { found: false };
    } catch (err) {
        console.error('Detection error:', err);
        return { found: false, error: err.message };
    }
});

ipcMain.on('set-tray-icon', (event, active) => {
    if (mainTray) {
        const iconPath = active ? 'assets/icon-active.png' : 'assets/icon.png';
        const fullPath = path.join(__dirname, iconPath);
        if (fs.existsSync(fullPath)) {
            mainTray.setImage(fullPath);
        }
    }
});

ipcMain.on('close-app', () => {
    app.quit();
});


