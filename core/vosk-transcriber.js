const vosk = require('vosk-koffi');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class VoskTranscriber extends EventEmitter {
    constructor(modelPath) {
        super();
        this.modelPath = modelPath;
        this.model = null;
        this.rec = null;
        this.isRecording = false;
    }

    init() {
        if (!fs.existsSync(this.modelPath)) {
            throw new Error(`Model not found at ${this.modelPath}. Please download a Vosk model.`);
        }
        this.model = new vosk.Model(this.modelPath);
        this.rec = new vosk.Recognizer({ model: this.model, sampleRate: 16000 });
    }

    // This method would be called with buffers from a microphone stream
    processBuffer(buffer) {
        if (!this.rec) return;

        if (this.rec.acceptWaveform(buffer)) {
            const result = this.rec.result();
            if (result.text) {
                this.emit('final', result.text);
            }
        } else {
            const partial = this.rec.partialResult();
            if (partial.partial) {
                this.emit('partial', partial.partial);
            }
        }
    }

    stop() {
        if (this.rec) {
            const finalResult = this.rec.finalResult();
            this.emit('final', finalResult.text);
            this.rec.free();
            this.rec = null;
        }
    }
}

module.exports = VoskTranscriber;
