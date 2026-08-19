import os
import logging
import subprocess
from typing import List, Dict, Any, Optional

from app.providers.base import TTSProvider
from app.config import config

logger = logging.getLogger(__name__)

class PiperTTSProvider(TTSProvider):
    """
    TTS Provider using Piper for ultra-fast, local, CPU-based speech generation.
    """
    
    def __init__(self):
        # The base directory where piper voices are mounted in the container
        self.model_dir = config.PIPER_MODELS_DIR
        self.default_voice = config.PIPER_DEFAULT_VOICE
        self.current_voice: Optional[str] = None
        self.piper_executable = "piper" # Assumes piper is in PATH inside container

    def load(self, voice_id: Optional[str] = None) -> None:
        """
        Piper is a command-line tool, so 'loading' just validates the model exists.
        """
        self.current_voice = voice_id or self.default_voice
        model_path = os.path.join(self.model_dir, f"{self.current_voice}.onnx")
        
        if not os.path.exists(model_path):
            logger.error(f"Piper model not found: {model_path}")
            # Fallback to default
            self.current_voice = self.default_voice
            model_path = os.path.join(self.model_dir, f"{self.current_voice}.onnx")
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Default Piper model not found: {model_path}")
                
        logger.info(f"Piper TTS set to use voice: {self.current_voice}")

    def unload(self) -> None:
        """Nothing to unload for Piper CLI."""
        pass

    def generate_audio(self, text: str, output_path: str, voice_id: Optional[str] = None, speed: float = 1.0) -> str:
        """
        Generates audio using Piper.
        Note: Piper doesn't natively support speed control in the CLI easily without modifying JSON config.
        We'll handle speed adjustments (time-stretching) using FFmpeg in the alignment step.
        """
        if not text.strip():
            raise ValueError("Empty text provided for TTS")
            
        use_voice = voice_id or self.current_voice
        
        # We need to make sure the voice is valid, but we might not have 'loaded' it yet if called directly
        model_path = os.path.join(self.model_dir, f"{use_voice}.onnx")
        if not os.path.exists(model_path):
             model_path = os.path.join(self.model_dir, f"{self.default_voice}.onnx")
             
        try:
            # Piper reads from stdin and writes to the file specified by --output_file
            # Format: echo "Hello world" | piper --model model.onnx --output_file out.wav
            cmd = [
                self.piper_executable,
                '--model', model_path,
                '--output_file', output_path
            ]
            
            # Using input parameter of subprocess.run to pass text to stdin
            result = subprocess.run(
                cmd,
                input=text,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            if result.returncode != 0:
                logger.error(f"Piper generation failed: {result.stderr}")
                raise RuntimeError("Piper TTS failed.")
                
            if not os.path.exists(output_path):
                raise FileNotFoundError("Piper TTS did not create the output file.")
                
            return output_path
            
        except Exception as e:
            logger.error(f"Piper TTS error: {str(e)}")
            raise

    def list_voices(self) -> List[Dict[str, Any]]:
        # In a real app, this would read the directory or a metadata file
        return [
            {"id": "en_US-lessac-high", "name": "Lessac (Female, High)", "gender": "female"},
            {"id": "en_US-libritts-high", "name": "LibriTTS (Multi, High)", "gender": "neutral"}
        ]
        
    def supports_feature(self, feature: str) -> bool:
        """Piper is very fast but basic."""
        supported = {
            "speed": False, # Handled externally
            "pitch": False,
            "emotion": False,
            "cloning": False
        }
        return supported.get(feature, False)
