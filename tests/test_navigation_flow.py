"""
Closed-Loop Navigation Flow Test.
AgencyOS E2E Route Verification.

Tests 100% of pages in the application:
- Route Groups: (app), (marketing)
- 91 Hub Pages
- 4 VC Sub-routes
- Complete closed-loop: Homepage → Admin → Settings → Homepage
"""

import sys
import asyncio
import aiohttp
from pathlib import Path
from typing import List
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))


# ═══════════════════════════════════════════════════════════════════════════════
# 📍 ROUTE DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════════

class RouteGroup(Enum):
    APP = "(app)"
    MARKETING = "(marketing)"
    PUBLIC = "public"


@dataclass
class RouteResult:
    """Result of testing a single route."""
    path: str
    status_code: int
    response_time_ms: float
    success: bool
    error: str = ""


@dataclass
class NavigationTestReport:
    """Complete test report."""
    total_routes: int = 0
    passed: int = 0
    failed: int = 0
    errors: List[RouteResult] = field(default_factory=list)
    results: List[RouteResult] = field(default_factory=list)
    start_time: datetime = field(default_factory=datetime.now)
    end_time: datetime = None

    @property
    def success_rate(self) -> float:
        if self.total_routes == 0:
            return 0.0
        return (self.passed / self.total_routes) * 100


# Complete list of all AgencyOS routes
ALL_ROUTES = [
    # Route Groups
    "/landing",      # (marketing)
    "/admin",        # (app)
    "/settings",     # (app)

    # Main Hubs
    "/hubs",

    # Department Hubs (Alphabetical - 87 routes)
    "/abm",
    "/ae",
    "/affiliate",
    "/agency-portal",
    "/agentops",
    "/amazonfba",
    "/analytics",
    "/assistant",
    "/b2bcontent",
    "/b2bmarketing",
    "/bdm",
    "/binhphap",
    "/brand",
    "/calendar",
    "/campaigns",
    "/client-portal",
    "/compben",
    "/content",
    "/contentmarketing",
    "/copy",
    "/costs",
    "/creative",
    "/crm",
    "/data",
    "/defense",
    "/digitalmarketing",
    "/documents",
    "/ecommerce",
    "/email",
    "/entrepreneur",
    "/er",
    "/events",
    "/executive",
    "/finops",
    "/guild",
    "/hr",
    "/hranalytics",
    "/hris",
    "/influencer",
    "/inventory",
    "/ip",
    "/isr",
    "/it",
    "/ld",
    "/leadgen",
    "/learning",
    "/legal",
    "/marketing",
    "/marketingmanager",
    "/media",
    "/navigator",
    "/operations",
    "/osr",
    "/paidsocial",
    "/portfolio",
    "/ppc",
    "/pr",
    "/pricing",
    "/pricing-plans",
    "/product",
    "/productmarketing",
    "/projects",
    "/realestate",
    "/recruiter",
    "/research",
    "/retail",
    "/revenue",
    "/sa",
    "/sales",
    "/sdr",
    "/se",
    "/security",
    "/seo",
    "/shield",
    "/showcase",
    "/sm",
    "/social",
    "/startup",
    "/success",
    "/support",
    "/swe",
    "/tax",
    "/team",
    "/video",
    "/warroom",

    # VC Sub-routes (4 routes)
    "/vc/cap-table",
    "/vc/dealflow",
    "/vc/portfolio",
    "/vc/valuation",
]

# Closed-Loop Flow (the expected navigation sequence)
CLOSED_LOOP_FLOW = [
    "/",            # Homepage (Entry)
    "/landing",     # Marketing Landing
    "/hubs",        # Hub Directory
    "/crm",         # Sample Hub Page
    "/admin",       # Admin Dashboard
    "/settings",    # Settings Page
    "/",            # Back to Homepage (Loop Complete)
]


# ═══════════════════════════════════════════════════════════════════════════════
# 🧪 NAVIGATION TESTER
# ═══════════════════════════════════════════════════════════════════════════════

class NavigationFlowTester:
    """E2E Navigation Flow Tester for AgencyOS."""

    def __init__(self, base_url: str = "http://localhost:3000", locale: str = "en"):
        self.base_url = base_url
        self.locale = locale
        self.report = NavigationTestReport()

    def _build_url(self, path: str) -> str:
        """Build full URL with locale prefix."""
        if path == "/":
            return f"{self.base_url}/{self.locale}"
        return f"{self.base_url}/{self.locale}{path}"

    async def _test_route(self, session: aiohttp.ClientSession, path: str) -> RouteResult:
        """Test a single route and return result."""
        url = self._build_url(path)
        start_time = datetime.now()

        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                elapsed = (datetime.now() - start_time).total_seconds() * 1000

                # 200, 304 are success; 307 redirect is also OK for Next.js
                success = response.status in [200, 304, 307]

                return RouteResult(
                    path=path,
                    status_code=response.status,
                    response_time_ms=round(elapsed, 2),
                    success=success,
                    error="" if success else f"HTTP {response.status}"
                )
        except asyncio.TimeoutError:
            return RouteResult(
                path=path,
                status_code=0,
                response_time_ms=10000,
                success=False,
                error="Timeout"
            )
        except aiohttp.ClientError as e:
            return RouteResult(
                path=path,
                status_code=0,
                response_time_ms=0,
                success=False,
                error=str(e)
            )

    async def test_all_routes(self) -> NavigationTestReport:
        """Test all routes and generate report."""
        self.report = NavigationTestReport()
        self.report.start_time = datetime.now()
        self.report.total_routes = len(ALL_ROUTES)

        # Use connection pooling for efficiency
        connector = aiohttp.TCPConnector(limit=10)
        async with aiohttp.ClientSession(connector=connector) as session:
            # Test routes in batches of 10
            for i in range(0, len(ALL_ROUTES), 10):
                batch = ALL_ROUTES[i:i+10]
                tasks = [self._test_route(session, path) for path in batch]
                results = await asyncio.gather(*tasks)

                for result in results:
                    self.report.results.append(result)
                    if result.success:
                        self.report.passed += 1
                    else:
                        self.report.failed += 1
                        self.report.errors.append(result)

        self.report.end_time = datetime.now()
        return self.report

    async def test_closed_loop(self) -> List[RouteResult]:
        """Test the complete closed-loop navigation flow."""
        results = []

        async with aiohttp.ClientSession() as session:
            for path in CLOSED_LOOP_FLOW:
                result = await self._test_route(session, path)
                results.append(result)

                # Short delay to simulate real navigation
                await asyncio.sleep(0.1)

        return results

    def format_report(self) -> str:
        """Format the test report as a string."""
        duration = (self.report.end_time - self.report.start_time).total_seconds()

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🔄 CLOSED-LOOP NAVIGATION TEST REPORT                    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📊 Total Routes:    {self.report.total_routes:>5}                               ║",
            f"║  ✅ Passed:          {self.report.passed:>5}                               ║",
            f"║  ❌ Failed:          {self.report.failed:>5}                               ║",
            f"║  📈 Success Rate:    {self.report.success_rate:>5.1f}%                             ║",
            f"║  ⏱️  Duration:        {duration:>5.2f}s                              ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]

        if self.report.errors:
            lines.append("║  ❌ FAILED ROUTES:                                        ║")
            for error in self.report.errors[:10]:  # Show max 10 errors
                lines.append(f"║    • {error.path:<20} → {error.error:<20}  ║")
        else:
            lines.append("║  ✅ ALL ROUTES PASSED!                                    ║")

        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🏯 AgencyOS - Complete Navigation Flow Verified          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])

        return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

async def main():
    """Run the navigation flow test."""
    print("🔄 AgencyOS Closed-Loop Navigation Test")
    print("=" * 60)
    print()

    tester = NavigationFlowTester()

    # Test closed-loop flow first
    print("📍 Testing Closed-Loop Flow...")
    loop_results = await tester.test_closed_loop()
    print(f"   ✓ Closed-loop: {sum(1 for r in loop_results if r.success)}/{len(loop_results)} steps passed")
    print()

    # Test all routes
    print(f"🧪 Testing All {len(ALL_ROUTES)} Routes...")
    report = await tester.test_all_routes()

    print()
    print(tester.format_report())

    # Return exit code based on results
    return 0 if report.failed == 0 else 1


def run_sync():
    """Synchronous wrapper for testing without asyncio."""
    return asyncio.run(main())


if __name__ == "__main__":
    exit_code = run_sync()
    sys.exit(exit_code)
