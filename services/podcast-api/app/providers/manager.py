"""
Model Manager Service.
Enforces strictly sequential loading of heavy AI models to stay within RAM limits.
(e.g., 8GB total system RAM constraint).
Only one heavy model (Whisper or NLLB) is loaded into RAM at any given time.
"""
import logging
from contextlib import contextmanager

from app.providers.asr.faster_whisper_provider import FasterWhisperProvider
from app.providers.translation.nllb_provider import NLLBProvider
from app.providers.llm.ollama_provider import OllamaProvider
from app.providers.tts.piper_provider import PiperTTSProvider
from app.providers.speaker.simple_provider import SimpleSpeakerProvider
from app.providers.prosody.basic_provider import BasicProsodyProvider

logger = logging.getLogger(__name__)

class ModelManager:
    """
    Singleton manager for AI models.
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance
        
    def __init__(self):
        if self.initialized:
            return
            
        self.asr = FasterWhisperProvider()
        self.translation = NLLBProvider()
        self.llm = OllamaProvider() # Ollama handles its own RAM management externally, but we keep the reference
        self.tts = PiperTTSProvider()
        self.speaker = SimpleSpeakerProvider()
        self.prosody = BasicProsodyProvider()
        
        self.active_heavy_model = None
        self.initialized = True
        
    def _unload_all_heavy_models(self):
        """Unloads all heavy models from RAM."""
        if self.asr.model is not None:
            self.asr.unload()
        if self.translation.translator is not None:
            self.translation.unload()
        self.active_heavy_model = None

    @contextmanager
    def use_asr(self):
        """Context manager to ensure ASR is loaded and others are unloaded."""
        try:
            if self.active_heavy_model != "ASR":
                self._unload_all_heavy_models()
                self.asr.load()
                self.active_heavy_model = "ASR"
            yield self.asr
        except Exception as e:
            logger.error(f"Error while using ASR: {e}")
            raise
            
    @contextmanager
    def use_translation(self):
        """Context manager to ensure NLLB is loaded and others are unloaded."""
        try:
            if self.active_heavy_model != "TRANSLATION":
                self._unload_all_heavy_models()
                self.translation.load()
                self.active_heavy_model = "TRANSLATION"
            yield self.translation
        except Exception as e:
            logger.error(f"Error while using Translation: {e}")
            raise

    # LLM (Ollama) and Piper are considered "light" or managed externally
    # so we don't need strict unloading for them, but we provide accessors
    def get_llm(self) -> OllamaProvider:
        return self.llm
        
    def get_tts(self) -> PiperTTSProvider:
        return self.tts

    def get_speaker_analyzer(self) -> SimpleSpeakerProvider:
        return self.speaker
        
    def get_prosody_analyzer(self) -> BasicProsodyProvider:
        return self.prosody
