/**
 * TTSManager
 * Automatically detects whether the local GPU engine is running.
 * If available, it routes requests to localhost.
 * If not, it falls back to the cloud API.
 */

const LOCAL_ENGINE_URL = 'http://localhost:8765';
const CLOUD_API_URL = '/api/tts'; // Adjust if cloud API path is different

class TTSManager {
    constructor() {
        this.isLocalAvailable = false;
        this.localStatus = null;
    }

    /**
     * Pings the local service to see if it's alive and ready.
     */
    async checkLocalEngine() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500); // Fast timeout

            const response = await fetch(`${LOCAL_ENGINE_URL}/health`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                this.isLocalAvailable = data.ready === true;
                this.localStatus = data;
                return this.isLocalAvailable;
            }
        } catch (error) {
            // Silently fail - means engine is not installed or not running
            this.isLocalAvailable = false;
            this.localStatus = null;
        }
        return false;
    }

    /**
     * Automatically routes the generation request to the best available provider.
     */
    async generateSpeech(text) {
        // Always verify local engine status before generating
        await this.checkLocalEngine();

        if (this.isLocalAvailable) {
            try {
                return await this._generateLocal(text);
            } catch (error) {
                console.warn("Local engine failed, falling back to cloud...", error);
                // Fallback intentionally left un-returned so it cascades to cloud
            }
        }
        
        return await this._generateCloud(text);
    }

    async _generateLocal(text) {
        const response = await fetch(`${LOCAL_ENGINE_URL}/v1/audio/speech`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: text,
                format: 'wav' 
            })
        });

        if (!response.ok) {
            throw new Error(`Local generation failed: ${response.status}`);
        }

        return await response.blob();
    }

    async _generateCloud(text) {
        // Map to existing cloud infrastructure (adjusting formData if needed)
        const fd = new FormData();
        fd.append('text', text);
        
        const response = await fetch(`${CLOUD_API_URL}/generate`, {
            method: 'POST',
            body: fd
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Cloud API Error ${response.status}`);
        }

        return await response.blob();
    }
}

export const ttsManager = new TTSManager();
