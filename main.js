const { app, BrowserWindow, Tray, Menu, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Core Modules
const localDetector = require('./core/local-detector');
const geminiDetector = require('./core/gemini-detector');
const dbManager = require('./core/db-manager');

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

    mainWindow.on('blur', () => {
        // Optionnel: cacher si clic ailleurs
        // mainWindow.hide();
    });
}

function createTray() {
    // Note: Utiliser un icone valide. En Linux, on peut utiliser un PNG.
    // Pour cet environnement, je placeholderai avec un icone standard.
    mainTray = new Tray(path.join(__dirname, 'assets/icon.png')); 
    
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Activer / Désactiver', click: () => toggleWindow() },
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
}

function toggleWindow() {
    if (mainWindow.isVisible()) {
        mainWindow.hide();
    } else {
        mainWindow.show();
    }
}

app.whenReady().then(() => {
    // Créer un icone minimaliste si manquant pour éviter crash
    const fs = require('fs');
    if (!fs.existsSync(path.join(__dirname, 'assets/icon.png'))) {
        // En prod, l'icone doit exister
    }

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
    // 1. Local Detection
    let result = localDetector.detect(text);
    if (result) return { ...result, mode: 'OFFLINE' };

    // 2. Gemini Fallback (auto key rotation handled internally)
    result = await geminiDetector.detect(text);
    if (result) return { ...result, mode: 'GEMINI' };

    return { found: false };
});

ipcMain.on('set-tray-icon', (event, active) => {
    if (mainTray) {
        const iconPath = active ? 'assets/icon-active.png' : 'assets/icon.png';
        if (fs.existsSync(path.join(__dirname, iconPath))) {
            mainTray.setImage(path.join(__dirname, iconPath));
        }
    }
});

ipcMain.on('notify', (event, data) => {
    // Logic for notifications
});

ipcMain.on('close-app', () => {
    app.quit();
});

