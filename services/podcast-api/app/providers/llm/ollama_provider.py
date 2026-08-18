import logging
import json
import requests
from typing import Dict, Any, Optional

from app.providers.base import LLMProvider
from app.config import config

logger = logging.getLogger(__name__)

class OllamaProvider(LLMProvider):
    """
    LLM provider wrapping the local Ollama API.
    """
    
    def __init__(self):
        self.base_url = config.OLLAMA_URL
        self.model = config.LLM_MODEL
        
    def generate(self, prompt: str, system_prompt: Optional[str] = None, max_tokens: int = 1024, temperature: float = 0.7) -> str:
        url = f"{self.base_url}/api/generate"
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": max_tokens,
                "temperature": temperature
            }
        }
        
        if system_prompt:
            payload["system"] = system_prompt
            
        try:
            response = requests.post(url, json=payload, timeout=120)
            response.raise_for_status()
            result = response.json()
            return result.get("response", "").strip()
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise

    def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """
        Forces the LLM to output valid JSON.
        Requires the prompt to explicitly ask for JSON.
        """
        url = f"{self.base_url}/api/generate"
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.1 # Low temperature for more deterministic JSON
            }
        }
        
        if system_prompt:
            payload["system"] = system_prompt
            
        try:
            response = requests.post(url, json=payload, timeout=120)
            response.raise_for_status()
            result = response.json()
            
            response_text = result.get("response", "").strip()
            
            # Ollama with format="json" guarantees valid JSON string
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Ollama returned invalid JSON: {e}")
            raise
        except Exception as e:
            logger.error(f"Ollama JSON generation failed: {e}")
            raise
