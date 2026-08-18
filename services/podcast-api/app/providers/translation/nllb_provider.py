import logging
from typing import List, Optional
import ctranslate2
import transformers

from app.providers.base import TranslationProvider
from app.config import config

logger = logging.getLogger(__name__)

class NLLBProvider(TranslationProvider):
    """
    Translation using NLLB-200 via CTranslate2.
    Optimized for CPU inference.
    """
    
    def __init__(self):
        self.model_name = config.NLLB_MODEL
        self.source_lang = config.NLLB_SOURCE_LANG
        self.target_lang = config.NLLB_TARGET_LANG
        self.translator: Optional[ctranslate2.Translator] = None
        self.tokenizer: Optional[transformers.PreTrainedTokenizerFast] = None

    def load(self) -> None:
        if self.translator is None:
            logger.info(f"Loading NLLB model '{self.model_name}' on CPU...")
            # We assume the model has been converted to CTranslate2 format beforehand,
            # or we are using a pre-converted model path. For this MVP, we load standard CT2.
            # E.g., 'michaelfeil/ct2fast-nllb-200-distilled-600M' from HuggingFace
            
            # Note: For production without GPU, int8 quantization is highly recommended
            ct2_model_path = "michaelfeil/ct2fast-nllb-200-distilled-600M" 
            
            try:
                # In a real environment, you'd download the snapshot. For code completeness:
                from huggingface_hub import snapshot_download
                model_path = snapshot_download(ct2_model_path)
                
                self.translator = ctranslate2.Translator(
                    model_path, 
                    device="cpu", 
                    compute_type="int8", 
                    inter_threads=config.CPU_THREADS,
                    intra_threads=1
                )
                
                self.tokenizer = transformers.AutoTokenizer.from_pretrained(
                    "facebook/nllb-200-distilled-600M", 
                    src_lang=self.source_lang
                )
                logger.info("NLLB loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load NLLB: {e}")
                raise

    def unload(self) -> None:
        if self.translator is not None:
            logger.info("Unloading NLLB model...")
            del self.translator
            del self.tokenizer
            self.translator = None
            self.tokenizer = None

    def translate(self, text: str, source_lang: str = None, target_lang: str = None, context: Optional[str] = None) -> str:
        if not text.strip():
            return ""
            
        return self.translate_batch([text], source_lang, target_lang)[0]

    def translate_batch(self, texts: List[str], source_lang: str = None, target_lang: str = None) -> List[str]:
        if not texts:
            return []
            
        if self.translator is None:
            self.load()
            
        src_lang = source_lang or self.source_lang
        tgt_lang = target_lang or self.target_lang
        
        # Tokenize source
        self.tokenizer.src_lang = src_lang
        source_tokens = [self.tokenizer.convert_ids_to_tokens(self.tokenizer.encode(t)) for t in texts]
        
        # Target prefix (language token)
        target_prefix = [[tgt_lang]] * len(texts)
        
        # Translate
        results = self.translator.translate_batch(
            source_tokens, 
            target_prefix=target_prefix,
            beam_size=4,
            max_batch_size=16
        )
        
        # Detokenize
        translated_texts = []
        for result in results:
            target_tokens = result.hypotheses[0][1:] # Skip the language token
            translated_text = self.tokenizer.decode(self.tokenizer.convert_tokens_to_ids(target_tokens))
            translated_texts.append(translated_text.strip())
            
        return translated_texts
