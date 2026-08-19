"""
Naturalization Service.
Uses the LLM (Qwen) to rewrite literal machine translation (NLLB) into
natural, conversational English while preserving the original Khmer meaning.
"""
import logging
from sqlalchemy.orm import Session

from app.providers.llm.ollama_provider import OllamaProvider
from app.models import PodcastSegment

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are a professional English podcast editor.
You are NOT freely translating this content.
You are editing an English translation of a Khmer speaker.

Make the English sound like something a real English-speaking person would naturally say aloud.
Preserve the exact semantic content of the original Khmer.
Do not invent information.
Do not remove important information.

Do not change:
- Names
- Numbers
- Dates
- Places
- Currency
- Units
- Technical terminology
- Negation
- Questions
- Speaker intention
- Important emotional meaning

Do not add information from your own knowledge.
You may change sentence structure and wording when necessary to create natural spoken English.
Use natural contractions where appropriate.
Avoid robotic, literal, textbook or unnecessarily formal English.

Naturalness must NEVER override semantic fidelity.
The final English must sound like a real person naturally saying what the Khmer speaker actually meant.

Return ONLY the naturalized English text. Do not add any introductory or concluding remarks.
"""

def naturalize_segment(
    db: Session, 
    segment: PodcastSegment, 
    llm_provider: OllamaProvider, 
    context_prompt: str
) -> bool:
    """
    Takes the raw English translation and naturalizes it.
    Updates the segment.english_natural field.
    Returns True if successful.
    """
    if not segment.english_raw:
        return False
        
    logger.info(f"Naturalizing segment {segment.id}")
    
    # Construct the user prompt incorporating all constraints
    user_prompt = f"""
{context_prompt}

--- LITERAL MACHINE TRANSLATION ---
{segment.english_raw}

Please rewrite the Literal Machine Translation into natural spoken English, following all instructions and respecting the provided context and terminology.
"""
    
    try:
        naturalized_text = llm_provider.generate(
            prompt=user_prompt,
            system_prompt=SYSTEM_PROMPT,
            max_tokens=1024,
            temperature=0.4 # Lower temperature for fidelity
        )
        
        # Clean up in case the LLM ignored instructions and added quotes
        naturalized_text = naturalized_text.strip(' \n"\'-')
        
        segment.english_natural = naturalized_text
        db.commit()
        return True
        
    except Exception as e:
        logger.error(f"Failed to naturalize segment {segment.id}: {e}")
        return False
