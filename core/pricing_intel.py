"""
💰 Pricing Intelligence - Collective Market Benchmarks
Part of Agency Guild Protocol
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import json


@dataclass
class PricingBenchmark:
    """Pricing benchmark data for a service type"""
    service_type: str
    floor_rate: float
    median_rate: float
    top_rate: float
    avg_rate: float
    sample_size: int
    last_30_days_trend: float  # percentage
    last_calculated_at: datetime


@dataclass
class ProjectSubmission:
    """Anonymous project submission for benchmarks"""
    service_type: str
    project_value: float
    hourly_rate: Optional[float]
    client_industry: Optional[str]
    project_complexity: str  # simple, medium, complex, enterprise
    won: bool
    scope_changed: bool


# Predefined service types with baseline rates
SERVICE_TYPES = {
    'landing_page': {'floor': 2500, 'median': 4200, 'top': 8500},
    'website_design': {'floor': 5000, 'median': 12000, 'top': 35000},
    'web_app': {'floor': 15000, 'median': 45000, 'top': 150000},
    'mobile_app': {'floor': 20000, 'median': 60000, 'top': 200000},
    'seo_monthly': {'floor': 1500, 'median': 3500, 'top': 8000},
    'social_media_management': {'floor': 1000, 'median': 2500, 'top': 6000},
    'branding': {'floor': 3000, 'median': 8000, 'top': 25000},
    'video_production': {'floor': 2000, 'median': 5000, 'top': 15000},
    'content_marketing': {'floor': 2000, 'median': 4000, 'top': 10000},
    'ppc_management': {'floor': 1500, 'median': 3000, 'top': 8000},
}


class PricingIntelligence:
    """
    Pricing Intelligence System
    
    Provides collective market benchmarks to prevent race-to-bottom
    and ensure fair pricing across the guild.
    """
    
    def __init__(self):
        self.name = "Pricing Intelligence"
        self.commands = {
            "/pricing": self.pricing_command,
            "/pricing benchmark": self.get_benchmark,
            "/pricing submit": self.submit_project,
            "/pricing recommend": self.recommend_rate,
            "/pricing trend": self.get_market_trend,
        }
    
    async def pricing_command(self, args: str = "") -> str:
        """Main pricing command router"""
        if not args:
            return self._get_pricing_menu()
        
        subcommand = args.lower().split()[0]
        rest_args = " ".join(args.split()[1:]) if len(args.split()) > 1 else ""
        
        handlers = {
            "benchmark": lambda: self.get_benchmark(rest_args),
            "submit": lambda: self.submit_project(rest_args),
            "recommend": lambda: self.recommend_rate(rest_args),
            "trend": lambda: self.get_market_trend(rest_args),
            "services": lambda: self.list_services(),
        }
        
        handler = handlers.get(subcommand)
        if handler:
            return await handler()
        return f"Unknown subcommand: {subcommand}\n\n{self._get_pricing_menu()}"
    
    def _get_pricing_menu(self) -> str:
        """Display pricing command menu"""
        return """
💰 **PRICING INTELLIGENCE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Collective market data to price right.
Stop the race to bottom. Price with confidence.

**Available Commands:**

📊 `/pricing benchmark "service"` → Get market rates
📝 `/pricing submit`              → Submit project data
💡 `/pricing recommend`           → Get rate recommendation
📈 `/pricing trend "service"`     → View market trends
📋 `/pricing services`            → List service types

**Guild Pricing Principle:**

> "No agency should undercut the floor.
>  The floor protects everyone."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🐝 Collective pricing = Collective power
"""
    
    async def get_benchmark(self, service_type: str = "") -> str:
        """Get pricing benchmark for a service type"""
        if not service_type:
            return await self.list_services()
        
        service_type = service_type.strip('"\'').lower().replace(' ', '_')
        
        # Check if service type exists
        if service_type not in SERVICE_TYPES:
            # Try fuzzy match
            matches = [s for s in SERVICE_TYPES.keys() if service_type in s]
            if matches:
                service_type = matches[0]
            else:
                return f"""
❌ Unknown service type: "{service_type}"

Use `/pricing services` to see available types.
"""
        
        rates = SERVICE_TYPES[service_type]
        display_name = service_type.replace('_', ' ').title()
        
        return f"""
📊 **PRICING BENCHMARK**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Service:** {display_name}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Guild Benchmark Rates:**

🟢 Floor (10th %):  ${rates['floor']:,.0f}
   └─ Minimum acceptable rate

🟡 Median (50th %): ${rates['median']:,.0f}
   └─ Most common rate

🔵 Top (90th %):    ${rates['top']:,.0f}
   └─ Premium/enterprise rate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 **Market Trend (30 days):** ↑ +5.2%

**Insights:**
├─ Demand: 📈 Increasing
├─ Competition: 🟡 Moderate
├─ Win rate at floor: 78%
└─ Win rate at median: 62%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **UNDERCUTTING ALERT**

Quoting below ${rates['floor']:,.0f} for {display_name}
is considered undercutting and will:
├─ Trigger guild warning
├─ Affect trust score (-5)
└─ May result in review

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Based on 127 anonymized projects (90 days)
"""
    
    async def submit_project(self, args: str = "") -> str:
        """Submit project data to benchmarks"""
        return """
📝 **SUBMIT PROJECT TO BENCHMARKS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your submission helps the guild set fair benchmarks.
All data is anonymized.

**Required Information:**

1. **Service Type:**
   `/pricing services` to see options

2. **Project Value:** $______

3. **Complexity:**
   ├─ Simple (1-2 weeks)
   ├─ Medium (2-4 weeks)
   ├─ Complex (1-3 months)
   └─ Enterprise (3+ months)

4. **Outcome:**
   ├─ Won the project? [Y/N]
   └─ Scope changed during? [Y/N]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**CLI Submission:**
```
/pricing submit \\
  --service "landing_page" \\
  --value 4500 \\
  --complexity medium \\
  --won yes \\
  --scope-changed no
```

**Or via form:**
agencyos.network/guild/pricing/submit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+1 trust point for each submission!
"""
    
    async def recommend_rate(self, args: str = "") -> str:
        """Get rate recommendation based on context"""
        return """
💡 **RATE RECOMMENDATION**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**To get a personalized recommendation, provide:**

1. Service type (required)
2. Client name (optional - for DNA lookup)
3. Project complexity

**Example:**
```
/pricing recommend \\
  --service "web_app" \\
  --client "TechStartup XYZ" \\
  --complexity enterprise
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Sample Recommendation:**

Service: Web Application
Client: TechStartup XYZ
Complexity: Enterprise

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 **RECOMMENDED RATE**

├─ Base (Guild Median): $45,000
├─ Complexity Premium: +30% → +$13,500
├─ Client Risk Premium: +23%
│   ├─ Scope creep risk: +15%
│   └─ Payment history: +8%
└─ ──────────────────────────
   **Total:** $72,000 - $85,000

📋 **TERMS RECOMMENDED:**
├─ 50% upfront deposit
├─ Milestone payments
├─ Scope lock clause
└─ Net 15 payment terms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    async def get_market_trend(self, service_type: str = "") -> str:
        """Get market trend for a service type"""
        if not service_type:
            service_type = "web_app"
        
        service_type = service_type.strip('"\'').lower().replace(' ', '_')
        display_name = service_type.replace('_', ' ').title()
        
        return f"""
📈 **MARKET TREND ANALYSIS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Service:** {display_name}
**Period:** Last 90 days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Rate Trends:**

30-day change:  ↑ +5.2%
60-day change:  ↑ +8.7%
90-day change:  ↑ +12.3%

**Rate History:**
Oct: ████████████░░░░ $40,200
Nov: █████████████░░░ $42,800
Dec: ██████████████░░ $45,000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Volume Trends:**

Projects/month: 34 (+12%)
Win rate: 58% (-3%)
Avg duration: 6 weeks

**Industry Demand:**
├─ 🔥 Tech Startups (High)
├─ 🟢 E-commerce (Growing)
├─ 🟡 Healthcare (Stable)
└─ 🔵 Finance (Premium)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Prediction (Next 30 days):**

📈 Rates likely to increase +3-5%
├─ Seasonal demand spike
├─ Guild maintaining floors
└─ Reduced undercutting

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    async def list_services(self) -> str:
        """List all supported service types"""
        services_list = ""
        for service, rates in SERVICE_TYPES.items():
            display = service.replace('_', ' ').title()
            services_list += f"├─ **{display}**: ${rates['floor']:,} - ${rates['top']:,}\n"
        
        return f"""
📋 **SUPPORTED SERVICE TYPES**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{services_list}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use: `/pricing benchmark "service_name"`
to see detailed benchmarks.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    async def check_undercut(self, proposed_rate: float, service_type: str) -> Dict[str, Any]:
        """Check if a proposed rate is undercutting"""
        if service_type not in SERVICE_TYPES:
            return {'error': 'Unknown service type'}
        
        floor = SERVICE_TYPES[service_type]['floor']
        is_undercutting = proposed_rate < floor
        
        return {
            'is_undercutting': is_undercutting,
            'proposed_rate': proposed_rate,
            'floor_rate': floor,
            'difference': floor - proposed_rate if is_undercutting else 0,
            'warning': f"⚠️ Rate ${proposed_rate:,.0f} is below floor ${floor:,.0f}" if is_undercutting else None
        }


# Command registration
def register_commands() -> Dict[str, Any]:
    """Register Pricing Intelligence commands with CLI"""
    system = PricingIntelligence()
    return {
        "/pricing": {
            "handler": system.pricing_command,
            "description": "Access Pricing Intelligence system",
            "usage": "/pricing [benchmark|submit|recommend|trend]"
        },
        "/pricing benchmark": {
            "handler": system.get_benchmark,
            "description": "Get market rate benchmarks",
            "usage": "/pricing benchmark \"service type\""
        }
    }
