"""
Smart Segmentation Service.
Groups short VAD utterances into optimal processing segments (10-45 seconds)
without breaking sentences or conversational flows.
"""

from typing import List, Dict, Any
from app.config import config

def group_utterances_into_segments(utterances: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Takes a list of short utterances (e.g. from Whisper or VAD) and groups them
    into logical segments based on duration and silence gaps.
    
    utterances: [{'start': 0.0, 'end': 3.5, 'text': 'Hello'}, ...]
    Returns: [{'start': 0.0, 'end': 35.2, 'utterances': [...]}, ...]
    """
    if not utterances:
        return []
        
    segments = []
    current_segment = {
        'start': utterances[0]['start'],
        'end': utterances[0]['end'],
        'utterances': []
    }
    
    target_duration = config.SEGMENT_TARGET_SECONDS
    max_duration = config.SEGMENT_MAX_SECONDS
    
    for i, utt in enumerate(utterances):
        utt_duration = utt['end'] - utt['start']
        current_duration = current_segment['end'] - current_segment['start']
        
        # If adding this utterance would exceed max duration, close the segment BEFORE adding it
        if current_duration + utt_duration > max_duration and len(current_segment['utterances']) > 0:
            segments.append(current_segment)
            current_segment = {
                'start': utt['start'],
                'end': utt['end'],
                'utterances': [utt]
            }
            continue
            
        # Add the utterance
        current_segment['utterances'].append(utt)
        current_segment['end'] = utt['end']
        
        # Check if we should close the segment AFTER adding it
        # Criteria: We've reached target duration AND there is a reasonable pause after this utterance
        if current_segment['end'] - current_segment['start'] >= target_duration:
            # Is there a pause before the next utterance?
            if i + 1 < len(utterances):
                next_utt = utterances[i+1]
                pause_duration = next_utt['start'] - utt['end']
                
                # If there is a > 0.5s pause, it's a good place to break
                if pause_duration > 0.5:
                    segments.append(current_segment)
                    current_segment = {
                        'start': next_utt['start'],
                        'end': next_utt['end'],
                        'utterances': []
                    }
            else:
                # Last utterance, just let the loop finish and append outside
                pass
                
    # Append the last segment if not empty
    if current_segment['utterances']:
        segments.append(current_segment)
        
    # Recompute durations and indices
    for i, seg in enumerate(segments):
        seg['index'] = i
        seg['duration'] = seg['end'] - seg['start']
        # Extract full text for the segment
        seg['text'] = " ".join([u['text'].strip() for u in seg['utterances']])
        
    return segments
