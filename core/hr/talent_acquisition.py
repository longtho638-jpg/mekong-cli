"""
🔍 Talent Acquisition - Recruiting & Hiring (Proxy)
=============================================

This file is now a proxy for the modularized version in ./recruiting/
Please import from antigravity.core.hr.recruiting instead.
"""
import warnings

from .recruiting import (
    Candidate,
    CandidateStage,
    Interview,
    JobPosting,
    JobStatus,
    JobType,
    TalentAcquisition,
)

# Issue a deprecation warning
warnings.warn(
    "core.hr.talent_acquisition is deprecated. "
    "Use core.hr.recruiting instead.",
    DeprecationWarning,
    stacklevel=2
)
