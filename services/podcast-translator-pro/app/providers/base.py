"""
Abstract Base Classes for all AI providers.
This enforces modularity so underlying models (Whisper, NLLB, Qwen, Piper) can be swapped out.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

# ── 1. Speech Recognition (ASR) ─────────────────────────────────

class SpeechToTextProvider(ABC):
    @abstractmethod
    def load(self) -> None:
        pass

    @abstractmethod
    def unload(self) -> None:
        pass

    @abstractmethod
    def transcribe(self, audio_path: str, language: str = "km", pass_type: int = 1) -> List[Dict[str, Any]]:
        """
        pass_type 1: VAD + segment timestamps only
        pass_type 2: Word-level timestamps (if supported/required)
        Returns list of dicts with 'start', 'end', 'text', 'confidence'.
        """
        pass

# ── 2. Translation ──────────────────────────────────────────────

class TranslationProvider(ABC):
    @abstractmethod
    def load(self) -> None:
        pass

    @abstractmethod
    def unload(self) -> None:
        pass

    @abstractmethod
    def translate(self, text: str, source_lang: str = "km", target_lang: str = "en", context: Optional[str] = None) -> str:
        pass

    @abstractmethod
    def translate_batch(self, texts: List[str], source_lang: str = "km", target_lang: str = "en") -> List[str]:
        pass

# ── 3. Large Language Model (LLM) ───────────────────────────────

class LLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str, system_prompt: Optional[str] = None, max_tokens: int = 1024, temperature: float = 0.7) -> str:
        pass

    @abstractmethod
    def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """Force the LLM to output valid JSON."""
        pass

# ── 4. Text-to-Speech (TTS) ─────────────────────────────────────

class TTSProvider(ABC):
    @abstractmethod
    def load(self, voice_id: Optional[str] = None) -> None:
        pass

    @abstractmethod
    def unload(self) -> None:
        pass

    @abstractmethod
    def generate_audio(self, text: str, output_path: str, voice_id: Optional[str] = None, speed: float = 1.0) -> str:
        """Returns path to the generated audio file."""
        pass

    @abstractmethod
    def list_voices(self) -> List[Dict[str, Any]]:
        """List available voices and their capabilities."""
        pass
    
    @abstractmethod
    def supports_feature(self, feature: str) -> bool:
        """Check if TTS supports pitch, speed, prosody, emotion, cloning."""
        pass

# ── 5. Verification ─────────────────────────────────────────────

class VerificationProvider(ABC):
    @abstractmethod
    def verify_segment(self, original: str, english: str, context: Optional[str] = None) -> Dict[str, Any]:
        """
        Returns JSON with 'status' (PASS/REVISE), 'issues' list, 'needs_revision' bool.
        """
        pass

# ── 6. Audio / Prosody Analysis ─────────────────────────────────

class SpeakerAnalysisProvider(ABC):
    @abstractmethod
    def diarize(self, audio_path: str) -> List[Dict[str, Any]]:
        """Returns list of speaker segments with 'start', 'end', 'speaker_id'."""
        pass

class ProsodyProvider(ABC):
    @abstractmethod
    def analyze(self, audio_path: str, start_time: float, end_time: float) -> Dict[str, Any]:
        """Returns prosody features like energy, pause_durations, speaking_rate."""
        pass

class AlignmentProvider(ABC):
    @abstractmethod
    def align_timing(self, original_duration: float, generated_audio_path: str, output_path: str) -> str:
        """Applies time stretching if necessary. Returns path to aligned audio."""
        pass
