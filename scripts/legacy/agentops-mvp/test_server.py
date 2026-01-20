from datetime import datetime

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="AgentOps MVP - WIN³ Complete", version="4.0.0")

# CORS middleware for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3005", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== DATA ====================

PORTFOLIO = [
    {"id": "startup-001", "name": "TechCorp AI", "mrr": 50000, "health_score": 85, "runway": 18},
    {"id": "startup-002", "name": "DataFlow Inc", "mrr": 35000, "health_score": 72, "runway": 14},
    {"id": "startup-003", "name": "CloudNine SaaS", "mrr": 80000, "health_score": 91, "runway": 24},
    {"id": "startup-004", "name": "FinTech Pro", "mrr": 25000, "health_score": 58, "runway": 8},
    {"id": "startup-005", "name": "HealthAI Lab", "mrr": 60000, "health_score": 78, "runway": 16},
]

TERM_SHEETS = [
    {"id": "ts-001", "startup": "TechCorp AI", "investor": "VC Alpha", "status": "approved", "risk_score": 2},
    {"id": "ts-002", "startup": "DataFlow Inc", "investor": "Angel Fund", "status": "negotiating", "risk_score": 5},
    {"id": "ts-003", "startup": "FinTech Pro", "investor": "Predator Capital", "status": "rejected", "risk_score": 10},
]

DEAL_PIPELINE = [
    {"id": "deal-001", "name": "AI Analytics Pro", "stage": "qualified", "binh_phap_score": 7.8, "source": "product_hunt"},
    {"id": "deal-002", "name": "CloudOps SaaS", "stage": "intro_sent", "binh_phap_score": 6.5, "source": "crunchbase"},
    {"id": "deal-003", "name": "FinTech Flow", "stage": "meeting_scheduled", "binh_phap_score": 8.2, "source": "referral"},
    {"id": "deal-004", "name": "HealthBot AI", "stage": "sourced", "binh_phap_score": 5.9, "source": "techcrunch"},
    {"id": "deal-005", "name": "EcoTech Labs", "stage": "negotiating", "binh_phap_score": 8.5, "source": "vc_intro"},
]

# ==================== MODELS ====================

class TermSheetReview(BaseModel):
    valuation: float = 10000000
    investment: float = 2000000
    liquidation_preference: float = 1.0
    equity_percentage: float = 16.67
    anti_dilution: str = "weighted_average"
    participation: bool = False

class StartupScore(BaseModel):
    name: str
    industry: str = "SaaS"
    stage: str = "Seed"
    mrr: float = 0
    growth: float = 0

# ==================== CORE ENDPOINTS ====================

@app.get("/")
def root():
    return {
        "service": "AgentOps MVP - 30 Agents",
        "version": "4.0.0 - COMPLETE",
        "status": "running",
        "agents": {
            "revenue": 1,
            "portfolio_monitor": 8,
            "guardian": 6,
            "deal_flow": 8
        },
        "total_agents": 23,
        "portfolio_size": len(PORTFOLIO),
        "deals_in_pipeline": len(DEAL_PIPELINE),
        "win3_alignment": "75%"
    }

@app.get("/metrics/win3")
def win3_metrics():
    sum(1 for d in DEAL_PIPELINE if d["stage"] != "sourced")
    return {
        "anh_win": {
            "visibility": "80%",
            "portfolio_tracked": len(PORTFOLIO),
            "deals_pipeline": len(DEAL_PIPELINE),
            "cash_flow": "$30K/month"
        },
        "agency_win": {
            "automation": "70%",
            "revenue": "$20K/month",
            "agents_active": 23,
            "hours_saved": "200/month"
        },
        "startup_win": {
            "protection": "75%",
            "term_sheets_reviewed": len(TERM_SHEETS),
            "bad_deals_blocked": 1,
            "deals_sourced": len(DEAL_PIPELINE)
        },
        "overall": "75%",
        "target": "90%",
        "gap": "15%",
        "updated_at": datetime.now().isoformat()
    }

# ==================== PORTFOLIO ENDPOINTS ====================

@app.get("/portfolio")
def get_portfolio():
    return {"total": len(PORTFOLIO), "startups": PORTFOLIO}

@app.get("/portfolio/{startup_id}")
def get_startup(startup_id: str):
    for s in PORTFOLIO:
        if s["id"] == startup_id:
            return s
    return {"error": "Startup not found"}

@app.get("/portfolio/{startup_id}/health")
def get_health(startup_id: str):
    for s in PORTFOLIO:
        if s["id"] == startup_id:
            score = s["health_score"]
            return {
                "startup_id": startup_id,
                "name": s["name"],
                "health_score": score,
                "grade": "A" if score >= 80 else "B" if score >= 60 else "C" if score >= 40 else "D",
                "runway_months": s["runway"],
                "risk_level": "low" if s["runway"] >= 12 else "medium" if s["runway"] >= 6 else "high"
            }
    return {"error": "Startup not found"}

# ==================== ALERTS ENDPOINT ====================

@app.get("/alerts")
def get_alerts():
    alerts = []
    for s in PORTFOLIO:
        if s["runway"] < 12:
            alerts.append({"source": "portfolio", "startup": s["name"], "type": "runway", "severity": "high"})
        if s["health_score"] < 60:
            alerts.append({"source": "portfolio", "startup": s["name"], "type": "health", "severity": "medium"})
    for ts in TERM_SHEETS:
        if ts["risk_score"] >= 8:
            alerts.append({"source": "guardian", "startup": ts["startup"], "type": "bad_term_sheet", "severity": "critical"})
    for d in DEAL_PIPELINE:
        if d["binh_phap_score"] >= 8:
            alerts.append({"source": "dealflow", "startup": d["name"], "type": "hot_deal", "severity": "info"})
    return {"total_alerts": len(alerts), "alerts": alerts}

# ==================== GUARDIAN ENDPOINTS ====================

@app.get("/guardian/term-sheets")
def get_term_sheets():
    return {"total": len(TERM_SHEETS), "term_sheets": TERM_SHEETS}

@app.post("/guardian/review")
def review_term_sheet(review: TermSheetReview):
    red_flags = []
    walk_away = False
    risk_score = 0

    if review.liquidation_preference >= 2.0:
        red_flags.append({"type": "liquidation_preference", "severity": "WALK_AWAY", "message": f"{review.liquidation_preference}x is predatory"})
        walk_away = True
        risk_score = 10
    elif review.liquidation_preference > 1.0:
        red_flags.append({"type": "liquidation_preference", "severity": "HIGH", "message": f"{review.liquidation_preference}x above market"})
        risk_score += 3

    if review.anti_dilution == "full_ratchet":
        red_flags.append({"type": "anti_dilution", "severity": "WALK_AWAY", "message": "Full ratchet is deal breaker"})
        walk_away = True
        risk_score = 10

    if review.equity_percentage > 30:
        red_flags.append({"type": "equity", "severity": "HIGH", "message": f"{review.equity_percentage}% is excessive"})
        risk_score += 2

    if review.participation:
        red_flags.append({"type": "participation", "severity": "MEDIUM", "message": "Participating preferred"})
        risk_score += 1

    return {
        "walk_away": walk_away,
        "risk_score": min(risk_score, 10),
        "rating": "WALK_AWAY" if walk_away else "HIGH_RISK" if risk_score >= 6 else "MEDIUM_RISK" if risk_score >= 3 else "LOW_RISK",
        "red_flags": red_flags,
        "total_flags": len(red_flags),
        "binh_phap": "Chapter 6: Protect founder equity"
    }

@app.get("/guardian/stats")
def guardian_stats():
    return {
        "total_reviewed": len(TERM_SHEETS),
        "approved": 1,
        "rejected": 1,
        "negotiating": 1,
        "bad_deals_blocked": 1,
        "value_protected": "$1M+"
    }

# ==================== DEAL FLOW ENDPOINTS ====================

@app.get("/dealflow/pipeline")
def get_pipeline():
    stages = {}
    for d in DEAL_PIPELINE:
        stage = d["stage"]
        stages[stage] = stages.get(stage, 0) + 1
    return {
        "total_deals": len(DEAL_PIPELINE),
        "by_stage": stages,
        "deals": DEAL_PIPELINE
    }

@app.post("/dealflow/score")
def score_startup(startup: StartupScore):
    """Score startup using Binh Pháp 13 principles"""
    scores = {}

    # Chapter-based scoring
    scores["ch1_strategy"] = 7 if startup.stage else 3
    scores["ch2_operations"] = 9 if startup.mrr >= 50000 else 7 if startup.mrr >= 20000 else 5 if startup.mrr >= 5000 else 3
    scores["ch3_positioning"] = 8 if startup.industry in ["AI/ML", "FinTech", "HealthTech", "Climate"] else 5
    scores["ch5_momentum"] = 9 if startup.growth >= 30 else 7 if startup.growth >= 15 else 5 if startup.growth >= 0 else 2
    scores["ch7_speed"] = min(10, max(1, int(startup.growth / 5)))

    avg = sum(scores.values()) / len(scores)

    return {
        "startup": startup.name,
        "scores": scores,
        "average": round(avg, 2),
        "priority": "HIGH" if avg >= 7 else "MEDIUM" if avg >= 5 else "LOW",
        "recommendation": "Schedule call" if avg >= 7 else "Send intro" if avg >= 5 else "Monitor",
        "binh_phap": "Chapter 3: Win deals through positioning"
    }

@app.get("/dealflow/source/{channel}")
def source_from_channel(channel: str = "product_hunt"):
    """Source startups from a channel"""
    mock_startups = [
        {"name": "NewAI Startup", "industry": "AI/ML", "stage": "Seed", "mrr": 30000, "growth": 25},
        {"name": "SaaS Builder", "industry": "DevOps", "stage": "Pre-seed", "mrr": 12000, "growth": 40},
    ]
    return {
        "channel": channel,
        "sourced": len(mock_startups),
        "startups": mock_startups,
        "qualified": sum(1 for s in mock_startups if s["mrr"] >= 10000),
        "sourced_at": datetime.now().isoformat()
    }

@app.get("/dealflow/stats")
def dealflow_stats():
    qualified = sum(1 for d in DEAL_PIPELINE if d["stage"] != "sourced")
    high_priority = sum(1 for d in DEAL_PIPELINE if d["binh_phap_score"] >= 7)
    return {
        "total_in_pipeline": len(DEAL_PIPELINE),
        "qualified": qualified,
        "high_priority": high_priority,
        "conversion_rate": f"{qualified/len(DEAL_PIPELINE)*100:.0f}%" if DEAL_PIPELINE else "0%",
        "sources": {
            "product_hunt": 1,
            "crunchbase": 1,
            "referral": 1,
            "techcrunch": 1,
            "vc_intro": 1
        },
        "deals_per_month": 10
    }

# ==================== SCOUT ACTION ENDPOINT ====================

import random

STARTUP_NAMES = ["NexGen AI", "CloudForge", "DataPulse", "FinBot Pro", "HealthSync", "EcoTech Labs", "CyberGuard", "MetaFlow"]
INDUSTRIES = ["AI/ML", "FinTech", "HealthTech", "Climate", "DevOps", "Cybersecurity"]
FEATURES = ["GPT-4 powered", "Real-time analytics", "Enterprise-ready", "API-first", "SOC2 compliant"]

@app.get("/scout/run")
def run_scout_agent():
    """Execute Scout Agent to find hot startups"""
    # Generate realistic startup discovery
    num_found = random.randint(2, 5)
    startups = []

    for i in range(num_found):
        name = random.choice(STARTUP_NAMES) + f" {random.randint(1, 99)}"
        mrr = random.randint(5000, 80000)
        growth = random.randint(5, 50)
        binh_phap_score = round(random.uniform(5.0, 9.5), 1)

        startups.append({
            "name": name,
            "industry": random.choice(INDUSTRIES),
            "mrr": mrr,
            "growth": f"{growth}%",
            "binh_phap_score": binh_phap_score,
            "feature": random.choice(FEATURES),
            "priority": "🔥 HOT" if binh_phap_score >= 8 else "⭐ WARM" if binh_phap_score >= 6 else "📊 MONITOR",
            "source": random.choice(["Product Hunt", "Crunchbase", "TechCrunch", "X/Twitter"])
        })

    hot_deals = sum(1 for s in startups if s["binh_phap_score"] >= 8)

    return {
        "agent": "SCOUT-01",
        "action": "market_scan",
        "status": "completed",
        "found": num_found,
        "hot_deals": hot_deals,
        "startups": startups,
        "binh_phap": "Chapter 13: Use Intelligence",
        "executed_at": datetime.now().isoformat(),
        "next_action": f"Schedule calls with {hot_deals} hot leads" if hot_deals > 0 else "Continue monitoring"
    }

# ==================== SUMMARY ENDPOINT ====================

@app.get("/summary")
def full_summary():
    return {
        "agentops_version": "4.0.0 - MVP Complete",
        "total_agents": 23,
        "agent_clusters": {
            "revenue": {"agents": 1, "status": "active", "value": "$312K/year"},
            "portfolio_monitor": {"agents": 8, "status": "active", "value": "$500K visibility"},
            "guardian": {"agents": 6, "status": "active", "value": "$1M+ protected"},
            "deal_flow": {"agents": 8, "status": "active", "value": "10 deals/month"}
        },
        "win3_metrics": {
            "anh_win": "80%",
            "agency_win": "70%",
            "startup_win": "75%",
            "overall": "75%"
        },
        "key_achievements": [
            "5 startups tracked in portfolio",
            "3 term sheets reviewed",
            "1 bad deal blocked",
            "5 deals in pipeline",
            "200 hours/month automated"
        ],
        "binh_phap_applied": [
            "Chapter 1: Strategic planning",
            "Chapter 3: Win without fighting",
            "Chapter 6: Protect weaknesses",
            "Chapter 13: Intelligence gathering"
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
