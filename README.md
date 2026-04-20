# ✝️ VerseID (BibleBar)

**VerseID** is a lightweight, real-time Bible verse detection application that resides in your system tray. It uses offline speech-to-text (Vosk) and advanced semantic analysis (Gemini) to identify scripture as you speak.

![Premium UI](https://raw.githubusercontent.com/psycho237-prog/VerseID/master/renderer/index.html)

[![Build VerseID](https://github.com/psycho237-prog/VerseID/actions/workflows/build.yml/badge.svg)](https://github.com/psycho237-prog/VerseID/actions/workflows/build.yml)

## ✨ Key Features


- 🔌 **Offline-First**: Instant detection using a local SQLite database (~31,000 verses).
- ☁️ **Gemini Fallback**: Intelligent detection of paraphrases and approximate citations using Google Gemini 2.0.
- 🎙️ **Real-time Transcription**: Live speech-to-text feedback in a sleek popup.
- 🎨 **Premium Aesthetic**: Modern dark & gold theme with smooth micro-animations.
- 📥 **Windows System Tray**: Stays out of the way until needed, accessible with a single click.

## 🛠️ Technology Stack

- **Framework**: Electron v30+
- **Transcription**: Vosk (Offline STT)
- **Database**: SQLite + better-sqlite3
- **Fuzzy Search**: Fuse.js
- **AI Core**: Google Gemini 2.0 Flash API (Online Fallback)
- **Packaging**: Electron Builder (Target: Windows .exe)

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- NPM
- A Google Gemini API Key

### 2. Installation
```bash
git clone https://github.com/psycho237-prog/VerseID.git
cd VerseID
npm install
```

### 3. Configuration
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_key_here
```

### 4. Vosk Model Setup
To enable offline speech detection:
1. Download the [vosk-model-small-fr-0.22](https://alphacephei.com/vosk/models/vosk-model-small-fr-0.22.zip).
2. Extract it into `models/`.
3. Rename the folder to `vosk-model-fr`.
*(Refer to [models/README.md](models/README.md) for details)*

### 5. Running
```bash
npm start
```

## 📦 Packaging (.exe)
To generate the Windows installer:
```bash
npm run build
```

## 📜 License
This project is for educational/devotional purposes. Data sourced from open-source Bible corpora.

---
*Created by psycho237-prog — April 2026*
