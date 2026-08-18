"""
Context Manager Service.
Provides sliding window context and hierarchical summaries for LLM translation/naturalization.
"""
import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models import PodcastSegment, PodcastSummary

logger = logging.getLogger(__name__)

class ContextManager:
    def __init__(self, db: Session, job_id: str):
        self.db = db
        self.job_id = job_id
        
    def get_sliding_window(self, segment_index: int, window_size: int = 2) -> Dict[str, str]:
        """
        Gets the preceding and succeeding Khmer and English text for context.
        """
        # Get previous segments
        prev_segments = self.db.query(PodcastSegment).filter(
            PodcastSegment.job_id == self.job_id,
            PodcastSegment.index >= segment_index - window_size,
            PodcastSegment.index < segment_index
        ).order_by(PodcastSegment.index.asc()).all()
        
        # Get next segments (only Khmer is available at this point)
        next_segments = self.db.query(PodcastSegment).filter(
            PodcastSegment.job_id == self.job_id,
            PodcastSegment.index > segment_index,
            PodcastSegment.index <= segment_index + window_size
        ).order_by(PodcastSegment.index.asc()).all()
        
        prev_context = []
        for s in prev_segments:
            # Prefer naturalized English, fallback to raw, fallback to Khmer only
            eng = s.english_natural or s.english_raw or "[Not translated yet]"
            prev_context.append(f"Khmer: {s.khmer_text}\nEnglish: {eng}")
            
        next_context = []
        for s in next_segments:
            next_context.append(f"Khmer: {s.khmer_text}")
            
        return {
            "previous": "\n\n".join(prev_context),
            "next": "\n\n".join(next_context)
        }
        
    def get_relevant_summaries(self, current_time: float) -> str:
        """
        Retrieves the most recent hierarchical summaries up to the current time.
        """
        # We look for the most recent 5-min and 15-min summaries before current_time
        recent_5m = self.db.query(PodcastSummary).filter(
            PodcastSummary.job_id == self.job_id,
            PodcastSummary.summary_type == "5_MIN",
            PodcastSummary.end_time <= current_time
        ).order_by(PodcastSummary.end_time.desc()).first()
        
        recent_15m = self.db.query(PodcastSummary).filter(
            PodcastSummary.job_id == self.job_id,
            PodcastSummary.summary_type == "15_MIN",
            PodcastSummary.end_time <= current_time
        ).order_by(PodcastSummary.end_time.desc()).first()
        
        summaries = []
        if recent_15m:
            summaries.append(f"15-Minute Context: {recent_15m.summary_text}")
        if recent_5m:
            summaries.append(f"Recent 5-Minute Context: {recent_5m.summary_text}")
            
        return "\n\n".join(summaries)
        
    def build_llm_context_prompt(self, segment: PodcastSegment, glossary_text: str = "") -> str:
        """
        Builds the comprehensive context prompt for the LLM.
        """
        window = self.get_sliding_window(segment.index)
        summaries = self.get_relevant_summaries(segment.start_time)
        
        prompt_parts = []
        
        if summaries:
            prompt_parts.append(f"--- EPISODE SUMMARIES ---\n{summaries}\n")
            
        if window['previous']:
            prompt_parts.append(f"--- PREVIOUS CONTEXT ---\n{window['previous']}\n")
            
        prompt_parts.append(f"--- CURRENT SEGMENT (TO EDIT) ---\nKhmer: {segment.khmer_text}\n")
        
        if window['next']:
            prompt_parts.append(f"--- NEXT CONTEXT (For reference only) ---\n{window['next']}\n")
            
        if glossary_text:
            prompt_parts.append(f"--- {glossary_text} ---\n")
            
        return "\n".join(prompt_parts)
