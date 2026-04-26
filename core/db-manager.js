const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbPath;

if (process.versions && process.versions.electron) {
    const { app } = require('electron');
    const userDataPath = app.getPath('userData');
    
    // Ensure userData directory exists before copying
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    dbPath = path.join(userDataPath, 'bible.db');
    
    if (!fs.existsSync(dbPath)) {
        // In production, assets are in process.resourcesPath/assets
        // In development, they are in __dirname/../assets
        const assetsPath = app.isPackaged
            ? path.join(process.resourcesPath, 'assets/bible.db')
            : path.join(__dirname, '../assets/bible.db');
            
        try {
            if (fs.existsSync(assetsPath)) {
                fs.copyFileSync(assetsPath, dbPath);
            } else {
                console.error(`Source database not found at: ${assetsPath}`);
                // Fallback to internal path if extraResource failed
                const fallbackPath = path.join(__dirname, '../assets/bible.db');
                if (fs.existsSync(fallbackPath) && fallbackPath !== assetsPath) {
                    fs.copyFileSync(fallbackPath, dbPath);
                }
            }
        } catch (err) {
            console.error('Failed to copy db to userData:', err);
        }
    }
} else {
    // For non-electron environments (e.g. tests)
    dbPath = path.join(__dirname, '../assets/bible.db');
}

// better-sqlite3 cannot open files inside an .asar archive.
// The database MUST be on a real filesystem.
const db = new Database(dbPath);

// Initialisation des tables si elles n'existent pas (pour le cache)
db.exec(`
    CREATE TABLE IF NOT EXISTS cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query_hash TEXT UNIQUE,
        reference TEXT,
        text TEXT,
        version TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

module.exports = {
    db,
    getVerse: (text) => {
        return db.prepare('SELECT * FROM verses WHERE text LIKE ?').get(`%${text}%`);
    },
    saveToCache: (hash, ref) => {
        const stmt = db.prepare('INSERT OR REPLACE INTO cache (query_hash, reference, text, version) VALUES (?, ?, ?, ?)');
        stmt.run(hash, ref.reference, ref.text, ref.version);
    },
    getFromCache: (hash) => {
        return db.prepare('SELECT * FROM cache WHERE query_hash = ?').get(hash);
    },
    getAllVerses: () => {
        try {
            return db.prepare('SELECT book, chapter, verse, text, version FROM verses').all();
        } catch (err) {
            console.error("Error fetching all verses:", err);
            return [];
        }
    }
};
