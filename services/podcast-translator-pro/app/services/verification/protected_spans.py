"""
Protected Span Checker.
Ensures that protected glossary terms are accurately used in the final translation.
"""
import logging
from typing import List
from sqlalchemy.orm import Session

from app.models import PodcastSegment, FactEntity

logger = logging.getLogger(__name__)

def check_protected_spans(db: Session, segment: PodcastSegment) -> List[str]:
    """
    Checks if protected glossary terms are present in the final English text.
    Returns a list of issue strings. An empty list means passed.
    """
    issues = []
    
    # Fetch protected terms (is_protected = True)
    protected_terms = db.query(FactEntity).filter(
        FactEntity.segment_id == segment.id,
        FactEntity.is_protected == True,
        FactEntity.entity_type == "TERM"
    ).all()
    
    if not protected_terms:
        return issues
        
    english_text = (segment.english_natural or segment.english_raw or "").lower()
    
    for term in protected_terms:
        if not term.english_value:
            continue
            
        expected_english = term.english_value.lower().strip()
        
        # Simple exact match (case insensitive)
        if expected_english not in english_text:
            issues.append(f"PROTECTED TERM MISSING: Expected '{term.english_value}' for '{term.original_value}'.")
        else:
            term.verified_in_english = True
            
    db.commit()
    return issues
