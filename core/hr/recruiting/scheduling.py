"""
Interview scheduling and management logic.
"""
import uuid
from datetime import datetime, timedelta
from typing import Dict, List

from .models import Candidate, Interview


class SchedulingManager:
    def __init__(self):
        self.candidates: Dict[str, Candidate] = {}
        self.interviews: List[Interview] = []

    def schedule_interview(
        self,
        candidate: Candidate,
        interviewer: str,
        hours_from_now: int = 24,
        interview_type: str = "video",
    ) -> Interview:
        """Schedule an interview."""
        interview = Interview(
            id=f"INT-{uuid.uuid4().hex[:6].upper()}",
            candidate_id=candidate.id,
            interviewer=interviewer,
            scheduled_at=datetime.now() + timedelta(hours=hours_from_now),
            interview_type=interview_type,
        )
        self.interviews.append(interview)
        return interview

    def complete_interview(self, interview: Interview, score: int, feedback: str = ""):
        """Complete an interview with feedback."""
        interview.completed = True
        interview.score = score
        interview.feedback = feedback
