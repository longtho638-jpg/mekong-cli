"""
Email Drip Sequence Configuration
=================================
5-email welcome sequence for product purchasers

Timing:
- Email 1: Immediately after purchase
- Email 2: Day 1 (24 hours later)
- Email 3: Day 3
- Email 4: Day 5
- Email 5: Day 7

Templates: backend/emails/templates/
"""

from datetime import timedelta
from typing import List

from typing_extensions import TypedDict


class DripEmail(TypedDict):
    template: str
    subject: str
    delay: timedelta
    tags: List[str]


WELCOME_SEQUENCE: List[DripEmail] = [
    {
        "template": "01_welcome.html",
        "subject": "🎉 Your {{product_name}} is ready to download!",
        "delay": timedelta(minutes=0),  # Immediate
        "tags": ["welcome", "download"],
    },
    {
        "template": "02_quick_start.html",
        "subject": "⚡ Quick Start: Get running in 10 minutes",
        "delay": timedelta(days=1),
        "tags": ["onboarding", "quick-start"],
    },
    {
        "template": "03_feature_highlight.html",
        "subject": "💎 3 features you might have missed",
        "delay": timedelta(days=3),
        "tags": ["engagement", "features"],
    },
    {
        "template": "04_case_study.html",
        "subject": "🚀 How Sarah shipped in 4 hours",
        "delay": timedelta(days=5),
        "tags": ["social-proof", "case-study"],
    },
    {
        "template": "05_upsell.html",
        "subject": "🎁 Exclusive: Complete your stack for 37% off",
        "delay": timedelta(days=7),
        "tags": ["upsell", "bundle"],
    },
]


def get_email_schedule(purchase_date, sequence=WELCOME_SEQUENCE):
    """
    Generate scheduled send times for each email in the sequence.

    Args:
        purchase_date: datetime of purchase
        sequence: List of DripEmail configs

    Returns:
        List of (template, subject, send_at) tuples
    """
    schedule = []
    for email in sequence:
        send_at = purchase_date + email["delay"]
        schedule.append(
            {
                "template": email["template"],
                "subject": email["subject"],
                "send_at": send_at,
                "tags": email["tags"],
            }
        )
    return schedule


# Product-specific customizations
PRODUCT_VARIABLES = {
    "user-preferences-kit": {
        "docs_url": "https://docs.agencyos.network/kits/user-preferences",
        "bundle_url": "https://antigravity.gumroad.com/l/complete-bundle?ref=drip",
    },
    "webhook-manager-kit": {
        "docs_url": "https://docs.agencyos.network/kits/webhook-manager",
        "bundle_url": "https://antigravity.gumroad.com/l/complete-bundle?ref=drip",
    },
    "database-migration-kit": {
        "docs_url": "https://docs.agencyos.network/kits/database-migration",
        "bundle_url": "https://antigravity.gumroad.com/l/complete-bundle?ref=drip",
    },
    "api-rate-limiter-kit": {
        "docs_url": "https://docs.agencyos.network/kits/api-rate-limiter",
        "bundle_url": "https://antigravity.gumroad.com/l/complete-bundle?ref=drip",
    },
    "file-upload-kit": {
        "docs_url": "https://docs.agencyos.network/kits/file-upload",
        "bundle_url": "https://antigravity.gumroad.com/l/complete-bundle?ref=drip",
    },
    "full-text-search-kit": {
        "docs_url": "https://docs.agencyos.network/kits/full-text-search",
        "bundle_url": "https://antigravity.gumroad.com/l/complete-bundle?ref=drip",
    },
}
