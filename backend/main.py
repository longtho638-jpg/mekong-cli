"""
Mekong-CLI Backend - FastAPI Server
Hybrid Agentic Architecture for Local Marketing Agencies

Endpoints:
- /api/agents - Agent status and control
- /api/commands/* - 14 Mekong command endpoints
- /api/router - Hybrid Router stats
- /api/vibes - Vibe Tuner configuration
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.hybrid_router import HybridRouter
from core.vibe_tuner import VibeTuner, VibeRegion

# Import routes
from backend.routes.campaigns import router as campaigns_router
from backend.routes.agentops import router as agentops_router


# Initialize FastAPI
app = FastAPI(
    title="Mekong-CLI API",
    description="🌊 Deploy Your Agency in 15 Minutes - Backend API",
    version="1.0.0",
)

# Mount campaign routes
app.include_router(campaigns_router)
app.include_router(agentops_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize core services
router = HybridRouter()
vibe_tuner = VibeTuner()


# ============ Models ============

class CommandRequest(BaseModel):
    """Base request for command execution"""
    prompt: str
    vibe: Optional[str] = "neutral"
    override_provider: Optional[str] = None


class AgentTask(BaseModel):
    """Task for an agent"""
    agent_name: str
    task: str
    priority: str = "normal"


class VibeRequest(BaseModel):
    """Request to set vibe"""
    region: str
    location: Optional[str] = None


# ============ Health ============

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "healthy",
        "service": "mekong-cli-api",
        "version": "1.0.0",
        "tagline": "Deploy Your Agency in 15 Minutes"
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "hybrid_router": "active",
            "vibe_tuner": "active",
            "agents": "ready"
        }
    }


# ============ Agents ============

@app.get("/api/agents")
async def get_agents():
    """List all available agents and their status"""
    return {
        "quad_agents": [
            {"name": "Scout", "role": "Thu thập thông tin", "status": "ready"},
            {"name": "Editor", "role": "Biên tập nội dung", "status": "ready"},
            {"name": "Director", "role": "Đạo diễn video", "status": "ready"},
            {"name": "Community", "role": "Đăng bài & tương tác", "status": "ready"},
        ],
        "mekong_agents": [
            {"name": "Market Analyst", "role": "Phân tích giá nông sản ĐBSCL", "status": "ready"},
            {"name": "Zalo Integrator", "role": "Tích hợp Zalo OA/Mini App", "status": "ready"},
            {"name": "Local Copywriter", "role": "Viết content giọng địa phương", "status": "ready"},
        ],
        "total": 7
    }


@app.post("/api/agents/run")
async def run_agent(task: AgentTask):
    """Run a specific agent with a task"""
    valid_agents = ["scout", "editor", "director", "community", "market-analyst", "zalo-integrator", "local-copywriter"]
    
    if task.agent_name.lower() not in valid_agents:
        raise HTTPException(status_code=400, detail=f"Unknown agent: {task.agent_name}")
    
    # Simulate agent execution
    return {
        "status": "queued",
        "agent": task.agent_name,
        "task": task.task,
        "estimated_time": "30s",
        "job_id": "job_" + str(hash(task.task))[-8:]
    }


# ============ Hybrid Router ============

@app.get("/api/router/stats")
async def get_router_stats():
    """Get Hybrid Router statistics"""
    stats = router.get_stats()
    return {
        "stats": stats,
        "strategy": {
            "boss": "GPT-4/Gemini Pro (complex tasks)",
            "worker": "Llama 3.1 (simple tasks)"
        },
        "target_savings": "70%"
    }


@app.post("/api/router/route")
async def route_task(request: CommandRequest):
    """Route a task to optimal AI provider"""
    task_type, complexity = HybridRouter.analyze_task(request.prompt)
    result = router.route(task_type, complexity, len(request.prompt.split()) * 2)
    
    return {
        "provider": result.provider,
        "model": result.model,
        "estimated_cost": result.estimated_cost,
        "reason": result.reason,
        "task_analysis": {
            "type": task_type.value,
            "complexity": complexity.value
        }
    }


# ============ Vibe Tuner ============

@app.get("/api/vibes")
async def get_vibes():
    """List all available vibes"""
    return {
        "vibes": VibeTuner.list_vibes(),
        "current": vibe_tuner.current_vibe.value
    }


@app.post("/api/vibes/set")
async def set_vibe(request: VibeRequest):
    """Set active vibe by region or location"""
    if request.location:
        # Auto-detect from location
        tuner = VibeTuner.from_location(request.location)
        return {
            "location": request.location,
            "detected_vibe": tuner.current_vibe.value,
            "config": {
                "tone": tuner.config.tone,
                "style": tuner.config.style,
                "local_words": tuner.suggest_local_words(5)
            }
        }
    
    # Set by region ID
    try:
        region = VibeRegion(request.region)
        config = vibe_tuner.set_vibe(region)
        return {
            "vibe": region.value,
            "config": {
                "tone": config.tone,
                "style": config.style,
                "local_words": config.local_words[:5]
            }
        }
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown vibe: {request.region}")


@app.get("/api/vibes/prompt")
async def get_vibe_prompt(context: str = ""):
    """Get system prompt for current vibe"""
    return {
        "vibe": vibe_tuner.current_vibe.value,
        "system_prompt": vibe_tuner.get_system_prompt(context)
    }


# ============ Commands (14 Mekong Commands) ============

@app.post("/api/commands/khach-hang")
async def cmd_khach_hang(request: CommandRequest):
    """§1 Customer Profile - Hồ sơ khách hàng"""
    return {
        "command": "khach-hang",
        "section": "§1 Customer Profile",
        "status": "processing",
        "prompt": request.prompt,
        "output_format": "buyer_personas"
    }


@app.post("/api/commands/ke-hoach-kinh-doanh")
async def cmd_ke_hoach_kinh_doanh(request: CommandRequest):
    """§2 Business Plan - Kế hoạch kinh doanh"""
    return {
        "command": "ke-hoach-kinh-doanh",
        "section": "§2 Business Plan",
        "status": "processing",
        "prompt": request.prompt,
        "output_format": "business_model_canvas"
    }


@app.post("/api/commands/nghien-cuu-thi-truong")
async def cmd_nghien_cuu_thi_truong(request: CommandRequest):
    """§3 Market Research - Nghiên cứu thị trường"""
    return {
        "command": "nghien-cuu-thi-truong",
        "section": "§3 Market Research",
        "status": "processing",
        "prompt": request.prompt,
        "output_format": "tam_sam_som"
    }


@app.post("/api/commands/nhan-dien-thuong-hieu")
async def cmd_nhan_dien_thuong_hieu(request: CommandRequest):
    """§4 Brand Identity - Nhận diện thương hiệu"""
    return {
        "command": "nhan-dien-thuong-hieu",
        "section": "§4 Brand Identity",
        "status": "processing",
        "prompt": request.prompt,
        "output_format": "brand_guidelines"
    }


@app.post("/api/commands/thong-diep-tiep-thi")
async def cmd_thong_diep_tiep_thi(request: CommandRequest):
    """§5 Marketing Message - Thông điệp tiếp thị"""
    return {
        "command": "thong-diep-tiep-thi",
        "section": "§5 Marketing Message",
        "status": "processing",
        "prompt": request.prompt,
        "output_format": "usp_cta"
    }


@app.post("/api/commands/ke-hoach-tiep-thi")
async def cmd_ke_hoach_tiep_thi(request: CommandRequest):
    """§6 Marketing Plan - Kế hoạch tiếp thị"""
    return {
        "command": "ke-hoach-tiep-thi",
        "section": "§6 Marketing Plan",
        "status": "processing",
        "prompt": request.prompt,
        "output_format": "plg_strategy"
    }


@app.post("/api/commands/noi-dung-tiep-thi")
async def cmd_noi_dung_tiep_thi(request: CommandRequest):
    """§7 Marketing Content - Nội dung tiếp thị"""
    return {
        "command": "noi-dung-tiep-thi",
        "section": "§7 Marketing Content",
        "status": "processing",
        "prompt": request.prompt,
        "output_format": "website_landing_copy"
    }


@app.post("/api/commands/y-tuong-social-media")
async def cmd_y_tuong_social_media(request: CommandRequest):
    """§8 Social Media Content - 50 ý tưởng (5 pillars)"""
    return {
        "command": "y-tuong-social-media",
        "section": "§8 Social Media",
        "status": "processing",
        "prompt": request.prompt,
        "output_format": "50_ideas_5_pillars"
    }


@app.post("/api/commands/chien-luoc-ban-hang")
async def cmd_chien_luoc_ban_hang(request: CommandRequest):
    """§9 Sales Strategy - Chiến lược bán hàng"""
    return {
        "command": "chien-luoc-ban-hang",
        "section": "§9 Sales Strategy",
        "status": "processing",
        "prompt": request.prompt,
        "output_format": "gtm_channels"
    }


@app.post("/api/commands/ke-hoach-pr")
async def cmd_ke_hoach_pr(request: CommandRequest):
    """§10 PR Plan - Kế hoạch PR"""
    return {
        "command": "ke-hoach-pr",
        "section": "§10 PR Plan",
        "status": "processing",
        "prompt": request.prompt,
        "output_format": "strategic_partners"
    }


@app.post("/api/commands/ke-hoach-tang-truong")
async def cmd_ke_hoach_tang_truong(request: CommandRequest):
    """§11 Growth Plan - Kế hoạch tăng trưởng"""
    return {
        "command": "ke-hoach-tang-truong",
        "section": "§11 Growth Plan",
        "status": "processing",
        "prompt": request.prompt,
        "output_format": "bullseye_viral"
    }


@app.post("/api/commands/nong-san")
async def cmd_nong_san(request: CommandRequest):
    """Local Market - Phân tích giá nông sản ĐBSCL"""
    return {
        "command": "nong-san",
        "section": "Local Market",
        "status": "processing",
        "prompt": request.prompt,
        "output_format": "price_analysis"
    }


@app.post("/api/commands/ban-hang")
async def cmd_ban_hang(request: CommandRequest):
    """Sales Ops - Tối ưu bán hàng"""
    return {
        "command": "ban-hang",
        "section": "Sales Ops",
        "status": "processing",
        "prompt": request.prompt,
        "output_format": "funnel_optimization"
    }


@app.post("/api/commands/tiep-thi")
async def cmd_tiep_thi(request: CommandRequest):
    """Marketing Ops - Marketing automation"""
    return {
        "command": "tiep-thi",
        "section": "Marketing Ops",
        "status": "processing",
        "prompt": request.prompt,
        "output_format": "campaign_automation"
    }


# ============ Blue Ocean Protocol ============

@app.get("/api/guild/status")
async def get_guild_status():
    """Get current member's guild status"""
    return {
        "member": "Your Agency",
        "tier": "worker",
        "tier_emoji": "🐝",
        "status": "active",
        "trust_score": 67,
        "trust_max": 100,
        "score_breakdown": {
            "base": 50,
            "contributions": 10,
            "referrals": 5,
            "tenure": 2
        },
        "contributions": {
            "reports": 5,
            "verified": 3,
            "submissions": 8,
            "referrals": 1
        },
        "next_tier": {
            "name": "Queen Bee",
            "emoji": "👑",
            "required": 85,
            "needed": 18
        }
    }


@app.get("/api/guild/network")
async def get_guild_network():
    """Get network-wide statistics"""
    return {
        "members": {
            "total": 127,
            "active_30d": 89,
            "new_this_month": 12
        },
        "tiers": [
            {"name": "Queen Bees", "emoji": "👑", "count": 8, "pct": 6},
            {"name": "Workers", "emoji": "🐝", "count": 67, "pct": 53},
            {"name": "Larvae", "emoji": "🥚", "count": 52, "pct": 41}
        ],
        "intelligence": {
            "client_dnas": 1247,
            "verified_reports": 3892,
            "blacklisted": 23,
            "benchmarks": 45
        },
        "activity_30d": {
            "reports": 156,
            "verifications": 423,
            "referrals": 34,
            "defense_cases": 3,
            "value_protected": 127000
        }
    }


@app.get("/api/defense/check/{client_name}")
async def check_client_dna(client_name: str):
    """Check client DNA passport"""
    # Demo response - in production would query Supabase
    return {
        "client": client_name,
        "status": "safe",
        "trust_score": 92,
        "payment_history": "excellent",
        "reports": 0,
        "risk_level": "low",
        "recommendation": "proceed"
    }


@app.get("/api/defense/blacklist")
async def get_blacklist():
    """Get network blacklist"""
    return {
        "total": 23,
        "clients": [
            {"name": "Fake Startup Co", "risk": "critical", "reason": "Payment fraud", "reports": 8},
            {"name": "Scope Creeper LLC", "risk": "high", "reason": "Constant scope changes", "reports": 5},
            {"name": "Ghost Corp", "risk": "high", "reason": "Disappeared mid-project", "reports": 4}
        ]
    }


@app.get("/api/pricing/benchmarks")
async def get_pricing_benchmarks():
    """Get market rate benchmarks"""
    return {
        "avg_rate": 125,
        "rate_floor": 85,
        "your_rate": 140,
        "position": "top_25",
        "services": [
            {"name": "Web Development", "floor": 85, "avg": 125, "top": 200, "your": 140},
            {"name": "UI/UX Design", "floor": 75, "avg": 110, "top": 175, "your": 120},
            {"name": "SEO Services", "floor": 65, "avg": 95, "top": 150, "your": 100},
            {"name": "Content Writing", "floor": 45, "avg": 70, "top": 120, "your": 80},
            {"name": "Video Production", "floor": 100, "avg": 150, "top": 250, "your": 160}
        ],
        "rate_distribution": [
            {"range": "$75-100", "pct": 15},
            {"range": "$100-125", "pct": 35},
            {"range": "$125-150", "pct": 28},
            {"range": "$150-200", "pct": 18},
            {"range": "$200+", "pct": 4}
        ]
    }


# ============ Run Server ============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
