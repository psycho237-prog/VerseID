const micBtn = document.getElementById('mic-btn');
const liveText = document.getElementById('live-text');
const resultArea = document.getElementById('result-area');
const verseRef = document.getElementById('verse-ref');
const verseContent = document.getElementById('verse-content');
const verseSource = document.getElementById('verse-source');
const statusBadge = document.getElementById('status-badge');
const closeBtn = document.getElementById('close-btn');

let isListening = false;
let recognition = null;

// Use Web Speech API for the demo/UI part if available
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
                processTranscription(finalTranscript);
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        liveText.innerText = interimTranscript || finalTranscript || "Écoute en cours...";
        liveText.classList.remove('placeholder');
    };
}

micBtn.addEventListener('click', () => {
    isListening = !isListening;
    if (isListening) {
        micBtn.classList.add('active');
        if (recognition) recognition.start();
        window.electronAPI.setTrayIcon(true);
    } else {
        micBtn.classList.remove('active');
        if (recognition) recognition.stop();
        window.electronAPI.setTrayIcon(false);
        liveText.innerText = "En attente de parole...";
        liveText.classList.add('placeholder');
    }
});

async function processTranscription(text) {
    console.log("Analyzing:", text);
    const result = await window.electronAPI.detectVerse(text);
    
    if (result && result.found) {
        showResult(result);
    }
}

function showResult(result) {
    verseRef.innerText = result.reference;
    verseContent.innerText = `"${result.text}"`;
    verseSource.innerText = `Détection ${result.mode === 'OFFLINE' ? 'Locale' : 'Gemini'}`;
    
    // Update badge
    statusBadge.innerText = result.mode;
    statusBadge.className = `status-badge ${result.mode.toLowerCase()}`;
    
    resultArea.classList.remove('hidden');
    
    // Auto-hide result after some time if needed
    // setTimeout(() => resultArea.classList.add('hidden'), 10000);
}

closeBtn.addEventListener('click', () => {
    window.electronAPI.closeApp();
});
