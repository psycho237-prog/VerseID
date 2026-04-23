const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbPath;

if (process.versions && process.versions.electron) {
    const { app } = require('electron');
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'bible.db');
    
    if (!fs.existsSync(dbPath)) {
        const assetsPath = path.join(__dirname, '../assets/bible.db');
        try {
            fs.copyFileSync(assetsPath, dbPath);
        } catch (err) {
            console.error('Failed to copy db to userData:', err);
            dbPath = assetsPath;
        }
    }
} else {
    dbPath = path.join(__dirname, '../assets/bible.db');
}

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
        // Cette fonction sera utilisée par le local-detector avec Fuse.js
        // Mais on peut aussi faire des requêtes directes ici
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
        return db.prepare('SELECT book, chapter, verse, text, version FROM verses').all();
    }
};
