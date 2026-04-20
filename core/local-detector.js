const Fuse = require('fuse.js');
const dbManager = require('./db-manager');

let fuseInstance = null;

function initFuse() {
    try {
        const verses = dbManager.getAllVerses();
        const options = {
            keys: ['text'],
            threshold: 0.4,
            minMatchCharLength: 6,
            includeScore: true
        };
        fuseInstance = new Fuse(verses, options);
        console.log("Fuse.js initialized with", verses.length, "verses.");
    } catch (err) {
        console.error("Failed to initialize Fuse:", err);
    }
}

// Lazy init
if (!fuseInstance) initFuse();

module.exports = {
    detect: (text) => {
        if (!fuseInstance) return null;
        
        const results = fuseInstance.search(text);
        if (results.length > 0 && results[0].score < 0.4) {
            const match = results[0].item;
            return {
                found: true,
                reference: `${match.book} ${match.chapter}:${match.verse}`,
                text: match.text,
                version: match.version,
                score: results[0].score
            };
        }
        return null;
    }
};
