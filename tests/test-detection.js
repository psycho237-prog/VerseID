const localDetector = require('../core/local-detector');

async function runTests() {
    console.log("--- VerseID Detection Engine Test ---");
    
    const testCases = [
        { name: "Exact Match", text: "Car Dieu a tant aimé le monde", expected: "Jean 3:16" },
        { name: "Fuzzy Match", text: "Dieu a tellement aimé le monde", expected: "Jean 3:16" },
        { name: "Short Quote", text: "L'Éternel est mon berger", expected: "Psaumes 23:1" },
        { name: "No Match Case", text: "Aujourd'hui il fait beau sur Paris", expected: null }
    ];

    for (const test of testCases) {
        console.log(`\nTesting: "${test.text}" (${test.name})`);
        const result = localDetector.detect(test.text);
        
        if (result) {
            console.log(`✅ Found: ${result.reference} (Score: ${result.score.toFixed(4)})`);
            if (test.expected && result.reference.includes(test.expected)) {
                console.log("PASS");
            } else if (!test.expected) {
                console.log("FAIL: Expected no result");
            }
        } else {
            if (!test.expected) {
                console.log("✅ PASS: No result as expected");
            } else {
                console.log("❌ FAIL: Expected result not found locally");
            }
        }
    }
}

runTests().catch(console.error);
