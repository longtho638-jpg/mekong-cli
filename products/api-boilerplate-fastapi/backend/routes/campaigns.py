"""
Campaign API Routes
Full CRUD + Generation + Publishing
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime
import uuid

# Import agents
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.agents import ScoutAgent, EditorAgent, DirectorAgent, CommunityAgent, Platform


router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])

# ============ Models ============

class CampaignCreate(BaseModel):
    name: str
    pillar: str
    platforms: List[str] = ["facebook"]


class CampaignResponse(BaseModel):
    id: str
    name: str
    pillar: str
    status: str
    posts_count: int
    created_at: str


class ContentItem(BaseModel):
    id: str
    title: str
    body: str
    platform: str
    status: str


# ============ In-memory storage (replace with Supabase) ============

campaigns_db = {}
content_db = {}

# ============ Agents ============

scout = ScoutAgent()
editor = EditorAgent()
director = DirectorAgent()
community = CommunityAgent()

# ============ Routes ============

@router.get("/")
async def list_campaigns():
    """List all campaigns"""
    return {
        "campaigns": list(campaigns_db.values()),
        "total": len(campaigns_db)
    }


@router.post("/")
async def create_campaign(data: CampaignCreate):
    """Create new campaign"""
    campaign_id = str(uuid.uuid4())[:8]
    
    campaign = {
        "id": campaign_id,
        "name": data.name,
        "pillar": data.pillar,
        "platforms": data.platforms,
        "status": "draft",
        "posts_count": 0,
        "created_at": datetime.now().isoformat()
    }
    
    campaigns_db[campaign_id] = campaign
    content_db[campaign_id] = []
    
    return {"campaign": campaign, "message": "Campaign created"}


@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str):
    """Get campaign details"""
    if campaign_id not in campaigns_db:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return {
        "campaign": campaigns_db[campaign_id],
        "content": content_db.get(campaign_id, [])
    }


@router.post("/{campaign_id}/generate")
async def generate_content(campaign_id: str, count: int = 7):
    """Generate content using Quad-Agent pipeline"""
    if campaign_id not in campaigns_db:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaigns_db[campaign_id]
    pillar = campaign["pillar"]
    platforms = campaign["platforms"]
    
    # Step 1: Scout generates ideas
    ideas = scout.generate_ideas(pillar, count)
    
    # Step 2: Editor creates content for each idea
    generated = []
    for i, idea in enumerate(ideas):
        for platform in platforms:
            draft = editor.create_post(idea, pillar, platform)
            
            content_item = {
                "id": f"{campaign_id}_{i}_{platform}",
                "title": draft.title,
                "body": draft.body,
                "platform": platform,
                "pillar": pillar,
                "hashtags": draft.hashtags,
                "vibe": draft.vibe,
                "status": "ready"
            }
            generated.append(content_item)
    
    # Store content
    content_db[campaign_id] = generated
    campaigns_db[campaign_id]["posts_count"] = len(generated)
    campaigns_db[campaign_id]["status"] = "ready"
    
    return {
        "campaign_id": campaign_id,
        "generated": len(generated),
        "content": generated[:3],  # Preview first 3
        "message": f"Generated {len(generated)} posts"
    }


@router.post("/{campaign_id}/publish")
async def publish_campaign(campaign_id: str):
    """Publish campaign content to platforms"""
    if campaign_id not in campaigns_db:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    content = content_db.get(campaign_id, [])
    
    if not content:
        raise HTTPException(status_code=400, detail="No content to publish")
    
    # Schedule via Community agent
    scheduled = []
    for item in content:
        platform = Platform(item["platform"])
        post = community.schedule_post(item["body"], platform)
        scheduled.append({
            "id": post.id,
            "platform": platform.value,
            "scheduled_at": post.scheduled_at.isoformat()
        })
    
    campaigns_db[campaign_id]["status"] = "scheduled"
    
    return {
        "campaign_id": campaign_id,
        "scheduled": len(scheduled),
        "posts": scheduled[:3],
        "message": "Campaign scheduled for publishing"
    }


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str):
    """Delete campaign"""
    if campaign_id not in campaigns_db:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    del campaigns_db[campaign_id]
    if campaign_id in content_db:
        del content_db[campaign_id]
    
    return {"message": "Campaign deleted"}
