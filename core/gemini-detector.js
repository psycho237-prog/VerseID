const crypto = require('crypto');
const dbManager = require('./db-manager');

// Load all available API keys from environment, filter out empty ones
const API_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
].filter(Boolean);

let currentKeyIndex = 0;

function getNextKey() {
    if (API_KEYS.length === 0) return null;
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return key;
}

async function callGemini(text, apiKey) {
    const PROMPT = `Tu es un expert en Bible (Ancien et Nouveau Testament, toutes versions francophones). 
Analyse le texte transcrit suivant.
Si tu identifies un verset ou un extrait biblique (même partiel, paraphrasé ou approximatif), 
retourne UNIQUEMENT ce JSON sans markdown :
{ "found": true, "reference": "Livre Chapitre:Verset", "text": "...", "version": "LSG" }
Sinon retourne UNIQUEMENT : { "found": false }
Aucun texte en dehors du JSON.

Texte à analyser : "${text}"`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: PROMPT }] }],
                generationConfig: { maxOutputTokens: 150, temperature: 0.1 }
            })
        }
    );

    if (response.status === 429 || response.status === 403) {
        // Quota exceeded or forbidden — signal to rotate key
        throw new Error(`QUOTA_EXCEEDED:${response.status}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]) {
        throw new Error('No candidates in Gemini response');
    }

    const content = data.candidates[0].content.parts[0].text.trim();
    return JSON.parse(content);
}

async function detect(text) {
    if (API_KEYS.length === 0) {
        console.warn('[Gemini] No API keys configured.');
        return null;
    }

    // Check cache first
    const hash = crypto.createHash('md5').update(text).digest('hex');
    const cached = dbManager.getFromCache(hash);
    if (cached) {
        return { ...cached, found: true, source: 'Cache' };
    }

    // Try each key, rotating on quota errors
    const tried = new Set();
    while (tried.size < API_KEYS.length) {
        const apiKey = getNextKey();
        if (tried.has(apiKey)) break;
        tried.add(apiKey);

        try {
            const result = await callGemini(text, apiKey);
            if (result.found) {
                dbManager.saveToCache(hash, result);
                return { ...result, source: 'Gemini' };
            }
            return null; // Valid response but no verse found
        } catch (err) {
            if (err.message && err.message.startsWith('QUOTA_EXCEEDED')) {
                console.warn(`[Gemini] Key quota exceeded, rotating to next key...`);
                continue; // Try next key
            }
            console.error('[Gemini] API error:', err.message);
            return null;
        }
    }

    console.warn('[Gemini] All API keys exhausted or quota exceeded.');
    return null;
}

module.exports = { detect };
