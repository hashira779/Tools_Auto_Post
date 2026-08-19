"""
Glossary Matching Service.
Identifies glossary terms in the source Khmer text to ensure consistent
and correct translation of specific terminology.
"""
import logging
import re
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.models import GlossaryEntry, FactEntity

logger = logging.getLogger(__name__)

def match_glossary_terms(db: Session, segment_id: str, khmer_text: str, user_id: str = None) -> List[Dict[str, Any]]:
    """
    Finds glossary terms that appear in the Khmer text.
    Searches both global (admin) glossary and user-specific glossary.
    Saves matched terms as protected facts for the segment.
    Returns the list of matched terms to be used in LLM context.
    """
    if not khmer_text.strip():
        return []
        
    logger.info(f"Matching glossary terms for segment {segment_id}")
    
    # Fetch global glossary (user_id IS NULL) and user glossary
    query = db.query(GlossaryEntry).filter(
        (GlossaryEntry.user_id == None) | (GlossaryEntry.user_id == user_id)
    ).order_by(GlossaryEntry.priority.desc(), GlossaryEntry.khmer_term.desc())
    
    all_entries = query.all()
    
    matches = []
    matched_khmer_terms = set()
    
    for entry in all_entries:
        # Avoid overlapping matches by checking if we already matched this exact string
        if entry.khmer_term in matched_khmer_terms:
            continue
            
        # Case insensitive exact substring match (Khmer doesn't have cases, but just to be safe)
        if entry.khmer_term in khmer_text:
            matches.append({
                "khmer": entry.khmer_term,
                "english": entry.english_term,
                "context": entry.context_hint,
                "is_protected": entry.is_protected
            })
            matched_khmer_terms.add(entry.khmer_term)
            
            # If protected, save as a FactEntity so verification enforces it
            if entry.is_protected:
                fact = FactEntity(
                    segment_id=segment_id,
                    entity_type="TERM",
                    original_value=entry.khmer_term,
                    english_value=entry.english_term,
                    is_protected=True
                )
                db.add(fact)
                
    if matches:
        db.commit()
        
    return matches

def format_glossary_for_llm(matches: List[Dict[str, Any]]) -> str:
    """
    Formats the matched glossary terms into a string suitable for LLM prompt context.
    """
    if not matches:
        return ""
        
    lines = ["REQUIRED TERMINOLOGY:"]
    for match in matches:
        line = f"- '{match['khmer']}' MUST be translated as '{match['english']}'"
        if match['context']:
            line += f" (Context: {match['context']})"
        lines.append(line)
        
    return "\n".join(lines)
