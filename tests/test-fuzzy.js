const Fuse = require('fuse.js');

// Mock data to test fuzzy logic without SQLite dependency
const mockVerses = [
    { book: 'Jean', chapter: 3, verse: 16, text: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique...", version: 'LSG' },
    { book: 'Psaumes', chapter: 23, verse: 1, text: "L'Éternel est mon berger: je ne manquerai de rien.", version: 'LSG' }
];

const options = {
    keys: ['text'],
    threshold: 0.4,
    minMatchCharLength: 6,
    includeScore: true
};

const fuse = new Fuse(mockVerses, options);

async function runTests() {
    console.log("--- VerseID Logic Test (Fuzzy Matching) ---");
    
    const testCases = [
        { name: "Exact Match", text: "Car Dieu a tant aimé le monde", expected: "Jean 3:16" },
        { name: "Fuzzy Match", text: "Dieu a tellement aimé le monde", expected: "Jean 3:16" },
        { name: "Short Quote", text: "L'Éternel est mon berger", expected: "Psaumes 23:1" },
        { name: "No Match Case", text: "Aujourd'hui il fait beau sur Paris", expected: null }
    ];

    for (const test of testCases) {
        console.log(`\nTesting: "${test.text}"`);
        const results = fuse.search(test.text);
        
        if (results.length > 0 && results[0].score < 0.4) {
            const match = results[0].item;
            const reference = `${match.book} ${match.chapter}:${match.verse}`;
            console.log(`✅ Found: ${reference} (Score: ${results[0].score.toFixed(4)})`);
            if (test.expected && reference.includes(test.expected)) {
                console.log("RESULT: PASS");
            } else {
                console.log("RESULT: FAIL (Unexpected Result)");
            }
        } else {
            if (!test.expected) {
                console.log("✅ PASS: No result as expected");
            } else {
                console.log("❌ FAIL: Expected result not found");
            }
        }
    }
}

runTests();
