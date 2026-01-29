"""
Recruitment Agent - Hiring Pipeline Management (Proxy)
==================================================
This file is now a proxy for the modularized version in ./logic/
Please import from backend.agents.hrops.logic instead.
"""

import warnings

from .logic import Candidate, CandidateStage, Job, JobStatus, RecruitmentAgent

# Issue a deprecation warning
warnings.warn(
    "backend.agents.hrops.recruitment_agent is deprecated. Use backend.agents.hrops.logic instead.",
    DeprecationWarning,
    stacklevel=2,
)
