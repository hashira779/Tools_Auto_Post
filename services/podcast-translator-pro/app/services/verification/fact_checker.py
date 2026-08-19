"""
Deterministic Fact Checker.
Verifies that numbers, dates, and named entities extracted from the Khmer
source actually appear in the English translation.
"""
import logging
import re
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.models import PodcastSegment, FactEntity
from app.providers.llm.ollama_provider import OllamaProvider

logger = logging.getLogger(__name__)

def check_facts(db: Session, segment: PodcastSegment, llm_provider: OllamaProvider) -> List[str]:
    """
    Checks if all extracted facts for a segment are present in the naturalized English text.
    Returns a list of issue strings. An empty list means all facts passed.
    """
    issues = []
    
    # 1. Fetch facts
    facts = db.query(FactEntity).filter(
        FactEntity.segment_id == segment.id,
        FactEntity.is_protected == False # Protected terms are checked separately
    ).all()
    
    if not facts:
        return issues
        
    english_text = (segment.english_natural or segment.english_raw or "").lower()
    
    # 1.1 Extract numbers from English text deterministically
    english_numbers = set(re.findall(r'\d+', english_text))
    
    # Simple regex rules for numbers to normalize Khmer numerals (e.g. ០-៩ to 0-9)
    khmer_to_arabic = {
        '០': '0', '១': '1', '២': '2', '៣': '3', '៤': '4',
        '៥': '5', '៦': '6', '៧': '7', '៨': '8', '៩': '9'
    }
    
    facts_to_llm_check = []
    
    for fact in facts:
        orig = fact.original_value.lower()
        
        # Normalize Khmer numbers to Arabic digits
        norm_orig = orig
        for k, v in khmer_to_arabic.items():
            norm_orig = norm_orig.replace(k, v)
            
        # If it's a number, check if the Arabic digits are present
        if fact.entity_type in ['NUMBER', 'CURRENCY', 'UNIT']:
            digits = re.findall(r'\d+', norm_orig)
            if digits:
                missing_digits = [d for d in digits if d not in english_numbers]
                if not missing_digits:
                    fact.verified_in_english = True
                    continue
        
        # Try direct matching first (stripping punctuation/spaces)
        clean_orig = re.sub(r'[^\w\s]', '', norm_orig).strip()
        
        if clean_orig and clean_orig in english_text:
            fact.verified_in_english = True
            continue
            
        # If direct match fails, delegate to LLM
        facts_to_llm_check.append(fact.original_value)
        
    # 2. LLM Fallback Check for tricky facts
    if facts_to_llm_check:
        prompt = f"""
I have a list of facts extracted from a Khmer text.
I need to know if they are accurately represented in the English translation.
They might be written out as words or formatted differently.

English translation: "{segment.english_natural}"

Facts to check:
{facts_to_llm_check}

Return a JSON array of strings containing ONLY the facts from the list that are completely MISSING or INCORRECT in the English text.
If all facts are present (even if worded differently), return an empty array [].
"""
        try:
            missing_facts = llm_provider.generate_json(prompt=prompt, system_prompt="You are a strict fact-checker. Output JSON only.")
            
            if isinstance(missing_facts, list):
                for mf in missing_facts:
                    issues.append(f"Fact missing or changed: {mf}")
            
        except Exception as e:
            logger.error(f"LLM fact check fallback failed: {e}")
            # If LLM fails, we conservatively report the mismatch based on simple string logic
            for f in facts_to_llm_check:
                issues.append(f"Fact missing or changed: {f}")
                
    db.commit()
    return issues
