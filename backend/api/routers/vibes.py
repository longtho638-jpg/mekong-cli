import os
import sys

from fastapi import APIRouter, HTTPException

from backend.api.schemas import VibeRequest

# Ensure core is reachable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

try:
    from core.growth.vibe_tuner import VibeRegion, VibeTuner

    vibe_tuner = VibeTuner()
    VIBE_AVAILABLE = True
except ImportError:
    VIBE_AVAILABLE = False
    vibe_tuner = None

router = APIRouter(prefix="/api/vibes", tags=["Vibe Tuner"])


@router.get("")
async def get_vibes():
    """List all available vibes"""
    if not VIBE_AVAILABLE:
        return {"error": "Vibe Tuner not available"}

    return {"vibes": VibeTuner.list_vibes(), "current": vibe_tuner.current_vibe.value}


@router.post("/set")
async def set_vibe(request: VibeRequest):
    """Set active vibe by region or location"""
    if not VIBE_AVAILABLE:
        raise HTTPException(status_code=500, detail="Vibe Tuner not available")

    if request.location:
        # Auto-detect from location
        tuner = VibeTuner.from_location(request.location)
        return {
            "location": request.location,
            "detected_vibe": tuner.current_vibe.value,
            "config": {
                "tone": tuner.config.tone,
                "style": tuner.config.style,
                "local_words": tuner.suggest_local_words(5),
            },
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
                "local_words": config.local_words[:5],
            },
        }
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown vibe: {request.region}")


@router.get("/prompt")
async def get_vibe_prompt(context: str = ""):
    """Get system prompt for current vibe"""
    if not VIBE_AVAILABLE:
        raise HTTPException(status_code=500, detail="Vibe Tuner not available")

    return {
        "vibe": vibe_tuner.current_vibe.value,
        "system_prompt": vibe_tuner.get_system_prompt(context),
    }
