import logging
from typing import List, Dict, Any, Optional
from faster_whisper import WhisperModel

from app.providers.base import SpeechToTextProvider
from app.config import config

logger = logging.getLogger(__name__)

class FasterWhisperProvider(SpeechToTextProvider):
    """
    Implementation of ASR using faster-whisper.
    Configured for CPU-first execution (INT8).
    """
    
    def __init__(self):
        self.model_size = config.WHISPER_MODEL
        self.device = config.WHISPER_DEVICE # 'cpu'
        self.compute_type = config.WHISPER_COMPUTE_TYPE # 'int8'
        self.num_threads = config.WHISPER_THREADS
        self.model: Optional[WhisperModel] = None
        self.language = config.WHISPER_LANGUAGE

    def load(self) -> None:
        """Loads the model into RAM."""
        if self.model is None:
            logger.info(f"Loading faster-whisper model '{self.model_size}' on {self.device} ({self.compute_type})...")
            self.model = WhisperModel(
                self.model_size,
                device=self.device,
                compute_type=self.compute_type,
                cpu_threads=self.num_threads,
                # local_files_only=True # Enable in strict offline mode after first download
            )
            logger.info("faster-whisper loaded successfully.")

    def unload(self) -> None:
        """Unloads the model from RAM to free up space for other models."""
        if self.model is not None:
            logger.info("Unloading faster-whisper model...")
            del self.model
            self.model = None

    def transcribe(self, audio_path: str, language: str = None, pass_type: int = 1) -> List[Dict[str, Any]]:
        """
        Transcribes the audio file.
        Pass 1: VAD + Segment timestamps.
        Pass 2: Word timestamps (slower).
        """
        if self.model is None:
            self.load()
            
        target_lang = language or self.language
        logger.info(f"Transcribing {audio_path} in {target_lang} (pass_type={pass_type})")
        
        word_timestamps = (pass_type == 2)
        
        segments, info = self.model.transcribe(
            audio_path,
            language=target_lang,
            beam_size=5,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500), # Silence gap to split segments
            word_timestamps=word_timestamps
        )
        
        logger.info(f"Detected language '{info.language}' with probability {info.language_probability}")
        
        result_segments = []
        for segment in segments:
            seg_dict = {
                "start": segment.start,
                "end": segment.end,
                "text": segment.text.strip(),
                "confidence": segment.no_speech_prob # A bit inverse, but we can compute confidence later or use this
            }
            if word_timestamps and segment.words:
                seg_dict["words"] = [{"start": w.start, "end": w.end, "text": w.word} for w in segment.words]
                
            result_segments.append(seg_dict)
            
        return result_segments
