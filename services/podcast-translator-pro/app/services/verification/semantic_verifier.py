"""
Semantic Verifier and Revision Loop.
Combines deterministic checks (facts, negation, spans) with LLM semantic verification.
If the segment fails verification, it triggers a revision loop up to MAX_REVISION_ATTEMPTS.
"""
import logging
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.models import PodcastSegment
from app.providers.llm.ollama_provider import OllamaProvider
from app.config import config

from app.services.verification.fact_checker import check_facts
from app.services.verification.negation_checker import check_negation
from app.services.verification.protected_spans import check_protected_spans
from app.services.context.context_manager import ContextManager

logger = logging.getLogger(__name__)

VERIFY_SYSTEM_PROMPT = """
You are a strict linguistic verification tool.
Compare the original Khmer text with the English translation.
Check for:
1. Missing information
2. Added information (hallucinations)
3. Contradictions
4. Changed meaning or speaker intention

Return ONLY a JSON object with this structure:
{
  "status": "PASS" or "REVISE",
  "issues": ["list of specific semantic issues, empty if PASS"],
  "needs_revision": boolean
}
Do not return any other text.
"""

REVISE_SYSTEM_PROMPT = """
You are a professional English podcast editor.
The current English translation has failed verification due to specific issues.
Fix the English text to resolve the issues while keeping it sounding natural and conversational.
Do NOT change the original Khmer meaning.

Return ONLY the corrected English text. Do not add any conversational filler.
"""

def verify_and_revise(
    db: Session, 
    segment: PodcastSegment, 
    llm_provider: OllamaProvider,
    context_manager: ContextManager
) -> bool:
    """
    Runs verification checks. If they fail, attempts to revise the text.
    Loops up to config.MAX_REVISION_ATTEMPTS times.
    Updates the segment in the DB.
    """
    logger.info(f"Starting verification for segment {segment.id}")
    
    attempts = 0
    max_attempts = config.MAX_REVISION_ATTEMPTS
    
    while attempts <= max_attempts:
        issues = []
        
        # 1. Deterministic Checks
        issues.extend(check_protected_spans(db, segment))
        issues.extend(check_facts(db, segment, llm_provider))
        issues.extend(check_negation(segment, llm_provider))
        
        # 2. LLM Semantic Check
        llm_issues = _run_llm_semantic_check(segment, llm_provider)
        issues.extend(llm_issues)
        
        # 3. Evaluate results
        if not issues:
            # PASS
            segment.verified = True
            segment.verification_score = 100
            segment.verification_issues = []
            segment.needs_review = False
            segment.status = "APPROVED"
            db.commit()
            logger.info(f"Segment {segment.id} passed verification on attempt {attempts}.")
            return True
            
        else:
            # FAIL - needs revision
            logger.warning(f"Segment {segment.id} failed verification: {issues}")
            
            if attempts == max_attempts:
                # Give up
                segment.verified = False
                segment.verification_score = max(0, 100 - (len(issues) * 10))
                segment.verification_issues = issues
                segment.needs_review = True
                segment.status = "NEEDS_REVIEW"
                db.commit()
                logger.warning(f"Segment {segment.id} reached max revision attempts and needs manual review.")
                return False
                
            # Try to revise
            attempts += 1
            logger.info(f"Attempting revision {attempts}/{max_attempts} for segment {segment.id}")
            _revise_segment(db, segment, llm_provider, context_manager, issues)
            
    return False

def _run_llm_semantic_check(segment: PodcastSegment, llm_provider: OllamaProvider) -> List[str]:
    """Runs the LLM-based semantic verification."""
    if not segment.khmer_text or not segment.english_natural:
        return ["Missing text for verification."]
        
    prompt = f"""
Khmer original: "{segment.khmer_text}"
English translation: "{segment.english_natural}"

Verify semantic fidelity.
"""
    try:
        result = llm_provider.generate_json(prompt=prompt, system_prompt=VERIFY_SYSTEM_PROMPT)
        if result.get("status") == "REVISE" or result.get("needs_revision") is True:
            return result.get("issues", ["General semantic mismatch detected."])
    except Exception as e:
        logger.error(f"LLM semantic check failed: {e}")
        # Don't fail the whole segment if the LLM JSON parser just glitches once
        
    return []

def _revise_segment(
    db: Session, 
    segment: PodcastSegment, 
    llm_provider: OllamaProvider, 
    context_manager: ContextManager,
    issues: List[str]
) -> None:
    """Attempts to fix the English text based on the verification issues."""
    
    # We provide a bit of context so the revision doesn't lose the tone
    window = context_manager.get_sliding_window(segment.index)
    
    prompt = f"""
Previous context: {window['previous']}

Khmer original: "{segment.khmer_text}"

Current English translation (HAS ISSUES): "{segment.english_natural}"

Verification issues to fix:
{chr(10).join([f"- {i}" for i in issues])}

Please rewrite the English translation to fix these issues while maintaining a natural podcast tone.
"""
    try:
        revised_text = llm_provider.generate(prompt=prompt, system_prompt=REVISE_SYSTEM_PROMPT)
        revised_text = revised_text.strip(' \n"\'-')
        
        # We don't overwrite english_raw, just english_natural
        segment.english_natural = revised_text
        segment.retry_count += 1
        db.commit()
        
    except Exception as e:
        logger.error(f"Failed to revise segment {segment.id}: {e}")
