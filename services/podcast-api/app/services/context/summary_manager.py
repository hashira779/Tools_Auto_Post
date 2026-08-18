"""
Summary Manager Service.
Generates 5-minute, 15-minute, and episode summaries to build hierarchical context.
"""
import logging
from sqlalchemy.orm import Session

from app.providers.llm.ollama_provider import OllamaProvider
from app.models import PodcastSegment, PodcastSummary

logger = logging.getLogger(__name__)

def generate_summary(db: Session, job_id: str, start_time: float, end_time: float, summary_type: str, llm_provider: OllamaProvider) -> bool:
    """
    Generates a summary of the given time window and saves it to the DB.
    Returns True if successful.
    """
    logger.info(f"Generating {summary_type} summary for job {job_id} from {start_time} to {end_time}")
    
    # 1. Fetch segments in this window
    segments = db.query(PodcastSegment).filter(
        PodcastSegment.job_id == job_id,
        PodcastSegment.start_time >= start_time,
        PodcastSegment.start_time < end_time
    ).order_by(PodcastSegment.index.asc()).all()
    
    if not segments:
        return False
        
    # 2. Build text to summarize
    # If this is a higher-level summary (e.g. 15-min), it would be better to summarize the 5-min summaries.
    # For MVP, we will just summarize the English text of the segments.
    text_to_summarize = []
    for s in segments:
        eng = s.english_natural or s.english_raw
        if eng:
            text_to_summarize.append(eng)
            
    if not text_to_summarize:
        return False
        
    combined_text = "\n".join(text_to_summarize)
    
    # 3. Prompt LLM
    system_prompt = "You are an expert podcast summarizer. Summarize the following podcast transcript segment concisely in one paragraph, focusing on the main topics, facts, and conclusions discussed."
    prompt = f"Please summarize this transcript segment:\n\n{combined_text}"
    
    try:
        summary_text = llm_provider.generate(prompt=prompt, system_prompt=system_prompt, max_tokens=256)
        
        # 4. Save to DB
        summary = PodcastSummary(
            job_id=job_id,
            summary_type=summary_type,
            start_time=start_time,
            end_time=end_time,
            summary_text=summary_text
        )
        db.add(summary)
        db.commit()
        return True
        
    except Exception as e:
        logger.error(f"Failed to generate summary: {e}")
        return False
