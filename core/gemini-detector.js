const crypto = require('crypto');
const dbManager = require('./db-manager');

async function detect(text, apiKey) {
    if (!apiKey) return null;

    // Check cache first
    const hash = crypto.createHash('md5').update(text).digest('hex');
    const cached = dbManager.getFromCache(hash);
    if (cached) {
        return { ...cached, found: true, source: 'Cache' };
    }

    const PROMPT = `Tu es un expert en Bible (Ancien et Nouveau Testament, toutes versions francophones). 
Analyse le texte transcrit suivant.
Si tu identifies un verset ou un extrait biblique (même partiel, paraphrasé ou approximatif), 
retourne UNIQUEMENT ce JSON sans markdown :
{ "found": true, "reference": "Livre Chapitre:Verset", "text": "...", "version": "LSG" }
Sinon retourne UNIQUEMENT : { "found": false }
Aucun texte en dehors du JSON.

Texte à analyser : "${text}"`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: PROMPT }] }],
                generationConfig: {
                    maxOutputTokens: 150,
                    temperature: 0.1
                }
            })
        });

        const data = await response.json();
        const content = data.candidates[0].content.parts[0].text.trim();
        
        try {
            const result = JSON.parse(content);
            if (result.found) {
                dbManager.saveToCache(hash, result);
                return { ...result, source: 'Gemini' };
            }
        } catch (e) {
            console.error("Gemini response is not valid JSON:", content);
        }
    } catch (err) {
        console.error("Gemini API error:", err);
    }

    return null;
}

module.exports = { detect };
