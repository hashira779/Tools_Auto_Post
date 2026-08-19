"""
Fact Extraction Service.
Extracts immutable facts from the Khmer source text before translation.
These facts are later used to verify the English translation.
"""
import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.providers.llm.ollama_provider import OllamaProvider
from app.models import FactEntity

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are an expert Khmer linguistic analyst.
Extract all immutable facts from the following Khmer text.
Immutable facts include:
- Numbers (e.g. 500, 20%)
- Dates (e.g. 2026, ថ្ងៃស្អែក)
- Times (e.g. 3:30 PM, ម៉ោង ៣ រសៀល)
- Currency (e.g. $100, ៥០០រៀល)
- Units (e.g. 10 kg, ២០គីឡូម៉ែត្រ)
- Names of specific people, places, or organizations

Return ONLY a JSON object with the following structure. Do not return any other text.
{
  "numbers": ["..."],
  "dates": ["..."],
  "times": ["..."],
  "currency": ["..."],
  "units": ["..."],
  "names": ["..."],
  "locations": ["..."],
  "organizations": ["..."]
}
If a category has no facts, return an empty array for it.
"""

def extract_facts(db: Session, segment_id: str, khmer_text: str, llm_provider: OllamaProvider) -> int:
    """
    Extracts facts from Khmer text using the LLM and saves them to the DB.
    Returns the number of facts extracted.
    """
    if not khmer_text.strip():
        return 0
        
    logger.info(f"Extracting facts for segment {segment_id}")
    
    try:
        # Prompt LLM for JSON
        prompt = f"Extract facts from this Khmer text:\n\n{khmer_text}"
        result_json = llm_provider.generate_json(prompt=prompt, system_prompt=SYSTEM_PROMPT)
        
        fact_count = 0
        
        # Mapping from JSON keys to our entity_type enum
        category_map = {
            "numbers": "NUMBER",
            "dates": "DATE",
            "times": "TIME",
            "currency": "CURRENCY",
            "units": "UNIT",
            "names": "NAME",
            "locations": "LOCATION",
            "organizations": "ORG"
        }
        
        for json_key, entity_type in category_map.items():
            items = result_json.get(json_key, [])
            for item in items:
                if not item or not str(item).strip():
                    continue
                    
                fact = FactEntity(
                    segment_id=segment_id,
                    entity_type=entity_type,
                    original_value=str(item).strip()
                )
                db.add(fact)
                fact_count += 1
                
        db.commit()
        return fact_count
        
    except Exception as e:
        logger.error(f"Failed to extract facts for segment {segment_id}: {e}")
        # Not fatal, we just won't have facts for this segment
        return 0
