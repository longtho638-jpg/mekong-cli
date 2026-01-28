"""
Technical SEO Agent - Site Audits & Core Web Vitals (Proxy)
=====================================================
This file is now a proxy for the modularized version in ./logic/
Please import from backend.agents.seoops.logic instead.
"""
import warnings

from .logic import CoreWebVitals, IssueSeverity, IssueType, SEOIssue, TechnicalSEOAgent

# Issue a deprecation warning
warnings.warn(
    "backend.agents.seoops.technical_seo_agent is deprecated. "
    "Use backend.agents.seoops.logic instead.",
    DeprecationWarning,
    stacklevel=2
)
