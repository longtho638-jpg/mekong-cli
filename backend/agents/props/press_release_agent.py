"""
Press Release Agent - PR Content Generation
Generates and distributes press releases.
"""

import random
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional


class ReleaseType(Enum):
    PRODUCT_LAUNCH = "product_launch"
    PARTNERSHIP = "partnership"
    MILESTONE = "milestone"
    FUNDING = "funding"
    FEATURE = "feature"


class ReleaseStatus(Enum):
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    DISTRIBUTED = "distributed"


@dataclass
class PressRelease:
    """Press release document"""

    id: str
    headline: str
    subheadline: str
    body: str
    boilerplate: str
    release_type: ReleaseType
    status: ReleaseStatus = ReleaseStatus.DRAFT
    distribution_list: List[str] = field(default_factory=list)
    coverage_links: List[str] = field(default_factory=list)
    created_at: datetime = None
    distributed_at: Optional[datetime] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class PressReleaseAgent:
    """
    Press Release Agent - Tạo Thông cáo Báo chí

    Responsibilities:
    - Generate press releases
    - Manage boilerplate
    - Track distribution
    - Monitor coverage
    """

    # Company boilerplate
    BOILERPLATE = """
**Về Mekong-CLI**

Mekong-CLI là nền tảng mã nguồn mở đầu tiên giúp tự động hóa việc khởi tạo và vận hành Agency, được xây dựng cho nền kinh tế Gig Economy. Với kiến trúc Hybrid Agentic, Mekong-CLI cho phép Solopreneur triển khai agency hoàn chỉnh trong 15 phút với chi phí giảm 70%.

Website: mekong-cli.com | GitHub: github.com/mekong-cli
"""

    # Release templates
    TEMPLATES = {
        ReleaseType.PRODUCT_LAUNCH: {
            "headline": "Mekong-CLI Ra Mắt: Triển Khai Agency Tự Động Trong 15 Phút",
            "subheadline": "Nền tảng mã nguồn mở đầu tiên cho Agency Automation tại Việt Nam",
            "body": """
**{city}, {date}** – Mekong-CLI hôm nay chính thức ra mắt phiên bản 1.0, nền tảng CLI đầu tiên cho phép các Freelancer và Solopreneur xây dựng agency tự động.

**Tính năng nổi bật:**

• **Hybrid Router**: Tiết kiệm đến 70% chi phí AI bằng cách định tuyến thông minh giữa các model
• **Vibe Tuning**: AI có khả năng nói giọng địa phương, phù hợp với thị trường Việt Nam
• **15-Minute Deployment**: Triển khai agency hoàn chỉnh trong 15 phút

**Quote từ Founder:**

"{quote}"

**Thông tin liên hệ:**
Email: press@mekong-cli.com
""",
        },
        ReleaseType.PARTNERSHIP: {
            "headline": "Mekong-CLI Hợp Tác với {partner} Mở Rộng Hệ Sinh Thái",
            "subheadline": "Đối tác chiến lược nhằm thúc đẩy Local Agency tại Việt Nam",
            "body": """
**{city}, {date}** – Mekong-CLI công bố hợp tác chiến lược với {partner} nhằm mở rộng tiếp cận đến cộng đồng Developer và Marketer tại Việt Nam.

**Chi tiết hợp tác:**

• Workshop về Google Cloud và AI Agents
• Co-marketing và content collaboration
• Hỗ trợ kỹ thuật cho thành viên cộng đồng

**Quote:**

"{quote}"
""",
        },
    }

    def __init__(self):
        self.name = "Press Release"
        self.status = "ready"
        self.releases: Dict[str, PressRelease] = {}

    def generate_release(
        self,
        release_type: ReleaseType,
        city: str = "Hồ Chí Minh",
        quote: str = "Chúng tôi tin rằng AI sẽ democratize agency ownership.",
        partner: str = "Google Developer Groups",
    ) -> PressRelease:
        """Generate press release from template"""
        template = self.TEMPLATES.get(release_type, self.TEMPLATES[ReleaseType.PRODUCT_LAUNCH])

        date = datetime.now().strftime("%d/%m/%Y")

        headline = template["headline"].format(partner=partner)
        subheadline = template["subheadline"]
        body = template["body"].format(city=city, date=date, quote=quote, partner=partner)

        release_id = f"PR-{datetime.now().strftime('%Y%m%d')}-{random.randint(100, 999)}"

        release = PressRelease(
            id=release_id,
            headline=headline,
            subheadline=subheadline,
            body=body,
            boilerplate=self.BOILERPLATE,
            release_type=release_type,
        )

        self.releases[release_id] = release
        return release

    def approve(self, release_id: str) -> PressRelease:
        """Approve release for distribution"""
        if release_id not in self.releases:
            raise ValueError(f"Release not found: {release_id}")

        release = self.releases[release_id]
        release.status = ReleaseStatus.APPROVED
        return release

    def distribute(self, release_id: str, outlets: List[str] = None) -> PressRelease:
        """Distribute to outlets"""
        if release_id not in self.releases:
            raise ValueError(f"Release not found: {release_id}")

        if outlets is None:
            outlets = ["TechInAsia", "VnExpress", "Viblo", "Dev.to"]

        release = self.releases[release_id]
        release.status = ReleaseStatus.DISTRIBUTED
        release.distribution_list = outlets
        release.distributed_at = datetime.now()

        return release

    def add_coverage(self, release_id: str, url: str) -> PressRelease:
        """Add coverage link"""
        if release_id not in self.releases:
            raise ValueError(f"Release not found: {release_id}")

        release = self.releases[release_id]
        release.coverage_links.append(url)
        return release

    def get_stats(self) -> Dict:
        """Get PR statistics"""
        releases = list(self.releases.values())

        total_coverage = sum(len(r.coverage_links) for r in releases)

        return {
            "total_releases": len(releases),
            "distributed": len([r for r in releases if r.status == ReleaseStatus.DISTRIBUTED]),
            "total_coverage": total_coverage,
            "by_type": {
                rt.value: len([r for r in releases if r.release_type == rt]) for rt in ReleaseType
            },
        }


# Demo
if __name__ == "__main__":
    agent = PressReleaseAgent()

    print("📰 Press Release Agent Demo\n")

    # Generate release
    release = agent.generate_release(
        release_type=ReleaseType.PRODUCT_LAUNCH,
        city="Hồ Chí Minh",
        quote="Mekong-CLI sẽ democratize agency ownership cho mọi người.",
    )

    print(f"📄 Release: {release.id}")
    print(f"   Headline: {release.headline}")
    print(f"   Type: {release.release_type.value}")

    # Approve and distribute
    agent.approve(release.id)
    agent.distribute(release.id)

    print(f"\n✅ Status: {release.status.value}")
    print(f"   Distributed to: {', '.join(release.distribution_list)}")

    # Add coverage
    agent.add_coverage(release.id, "https://techinasia.com/mekong-cli-launch")
    print(f"   Coverage: {len(release.coverage_links)} articles")

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Releases: {stats['total_releases']}")
    print(f"   Coverage: {stats['total_coverage']}")
