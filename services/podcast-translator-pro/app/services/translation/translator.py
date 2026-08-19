"""
Translation Orchestrator Service.
Manages the pipeline from Khmer text to naturalized English:
1. Fact Extraction
2. Glossary Matching
3. Context Building
4. NLLB Machine Translation
5. Qwen Naturalization
"""
import logging
from sqlalchemy.orm import Session

from app.models import PodcastSegment
from app.providers.translation.nllb_provider import NLLBProvider
from app.providers.llm.ollama_provider import OllamaProvider

from app.services.fact_extraction.extractor import extract_facts
from app.services.glossary.matcher import match_glossary_terms, format_glossary_for_llm
from app.services.context.context_manager import ContextManager
from app.services.naturalization.naturalizer import naturalize_segment

logger = logging.getLogger(__name__)

def process_translation(
    db: Session, 
    segment: PodcastSegment, 
    nllb_provider: NLLBProvider, 
    llm_provider: OllamaProvider,
    context_manager: ContextManager,
    user_id: str = None
) -> bool:
    """
    Executes the full translation and naturalization pipeline for a single segment.
    """
    logger.info(f"Starting translation pipeline for segment {segment.id}")
    
    if not segment.khmer_text:
        logger.warning(f"Segment {segment.id} has no Khmer text to translate.")
        return False
        
    try:
        # 1. Fact Extraction (Optional, but highly recommended for verification later)
        # We catch errors inside extract_facts so it doesn't break the pipeline
        extract_facts(db, str(segment.id), segment.khmer_text, llm_provider)
        
        # 2. Glossary Matching
        glossary_matches = match_glossary_terms(db, str(segment.id), segment.khmer_text, user_id)
        glossary_prompt_text = format_glossary_for_llm(glossary_matches)
        
        # 3. Context Building
        llm_context_prompt = context_manager.build_llm_context_prompt(segment, glossary_prompt_text)
        
        # 4. NLLB Translation
        # Note: NLLB doesn't natively accept complex context, so we just translate the current sentence.
        # NLLB might support some prefixing but for MVP we translate isolated and let Qwen fix it.
        raw_english = nllb_provider.translate(segment.khmer_text)
        
        if not raw_english:
            raise ValueError("NLLB returned empty translation")
            
        segment.english_raw = raw_english
        db.commit()
        
        # 5. Qwen Naturalization
        success = naturalize_segment(db, segment, llm_provider, llm_context_prompt)
        
        if success:
            logger.info(f"Successfully translated and naturalized segment {segment.id}")
            return True
        else:
            logger.warning(f"Naturalization failed for segment {segment.id}, falling back to raw English.")
            # Even if naturalization fails, we have the raw English, which is better than nothing
            segment.english_natural = segment.english_raw
            db.commit()
            return True
            
    except Exception as e:
        logger.error(f"Translation pipeline failed for segment {segment.id}: {e}")
        return False
