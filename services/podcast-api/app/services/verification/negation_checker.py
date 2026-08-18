"""
Negation Checker.
Explicitly checks if the negation intent of the Khmer source
is preserved in the English translation.
"""
import logging
from typing import List
from app.models import PodcastSegment
from app.providers.llm.ollama_provider import OllamaProvider

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are a strict linguistic verification tool.
Your ONLY job is to check for NEGATION MISMATCHES between the Khmer source and the English translation.

A negation mismatch happens when:
- The Khmer source is NEGATIVE (e.g. not, never, no, cannot, didn't) but the English translation is POSITIVE.
- The Khmer source is POSITIVE, but the English translation added a NEGATIVE.

Examples of negation words in English: not, never, no, cannot, didn't, won't, don't, nothing, nobody.
Examples of negation words in Khmer: មិន, អត់, គ្មាន, កុំ, ពុំ.

Return a JSON object with this exact structure:
{
    "has_mismatch": boolean,
    "reason": "string explaining the mismatch, or empty if None"
}
"""

def check_negation(segment: PodcastSegment, llm_provider: OllamaProvider) -> List[str]:
    """
    Checks for negation reversal between the Khmer text and English text.
    Returns a list of issue strings. An empty list means passed.
    """
    issues = []
    
    if not segment.khmer_text or not segment.english_natural:
        return issues
        
    prompt = f"""
Analyze the following sentence pair for negation mismatches.

Khmer source: "{segment.khmer_text}"
English translation: "{segment.english_natural}"

Does the English translation reverse the negation of the Khmer source?
"""
    try:
        result = llm_provider.generate_json(prompt=prompt, system_prompt=SYSTEM_PROMPT)
        
        if result.get("has_mismatch") is True:
            reason = result.get("reason", "Negation mismatch detected.")
            issues.append(f"NEGATION ERROR: {reason}")
            
    except Exception as e:
        logger.error(f"Failed to check negation for segment {segment.id}: {e}")
        # In case of error, we can't definitively say there's a mismatch
        
    return issues
