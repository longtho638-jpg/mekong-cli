"""
Influencer Campaign Agent - Campaigns & ROI (Proxy)
==============================================
This file is now a proxy for the modularized version in ./logic/
Please import from backend.agents.influencermarketingops.logic instead.
"""

import warnings

from .logic import (
    CampaignStatus,
    ContentType,
    Deliverable,
    InfluencerCampaign,
    InfluencerCampaignAgent,
)

# Issue a deprecation warning
warnings.warn(
    "backend.agents.influencermarketingops.influencer_campaign_agent is deprecated. "
    "Use backend.agents.influencermarketingops.logic instead.",
    DeprecationWarning,
    stacklevel=2,
)
