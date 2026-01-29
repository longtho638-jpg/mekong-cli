"""
Press Release Agent core logic and templates.
"""

import random
from datetime import datetime
from typing import Dict

from .models import PressRelease, ReleaseStatus, ReleaseType


class PREngine:
    BOILERPLATE = "**Về Mekong-CLI**\n\nMekong-CLI là nền tảng mã nguồn mở..."
    TEMPLATES = {
        ReleaseType.PRODUCT_LAUNCH: {
            "headline": "Mekong-CLI Ra Mắt",
            "subheadline": "Nền tảng CLI 15 phút",
            "body": "**{city}, {date}** – Mekong-CLI chính thức ra mắt...",
        },
    }

    def __init__(self):
        self.releases: Dict[str, PressRelease] = {}

    def generate_release(
        self, release_type: ReleaseType, city: str = "Hồ Chí Minh"
    ) -> PressRelease:
        tpl = self.TEMPLATES.get(release_type, self.TEMPLATES[ReleaseType.PRODUCT_LAUNCH])
        rid = f"PR-{datetime.now().strftime('%Y%m%d')}-{random.randint(100, 999)}"
        release = PressRelease(
            id=rid,
            headline=tpl["headline"],
            subheadline=tpl["subheadline"],
            body=tpl["body"].format(city=city, date=datetime.now().strftime("%d/%m/%Y")),
            boilerplate=self.BOILERPLATE,
            release_type=release_type,
        )
        self.releases[rid] = release
        return release
