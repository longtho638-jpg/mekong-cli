"""
Default configurations for Viral Defense.
"""

from typing import Dict

from .models import DefenseLevel, DegradationRule, ScaleAction, ScaleTrigger

# Threshold Constants
CPU_SCALE_UP = 80.0
CPU_SCALE_DOWN = 30.0
MEMORY_ALERT = 90.0
QUEUE_DEPTH_SCALE = 100

def get_default_triggers() -> Dict[str, ScaleTrigger]:
    """Get default scale triggers."""
    return {
        "cpu_high": ScaleTrigger(
            "cpu_high", "cpu_usage", CPU_SCALE_UP, ScaleAction.SCALE_UP, 120
        ),
        "cpu_low": ScaleTrigger(
            "cpu_low", "cpu_usage", CPU_SCALE_DOWN, ScaleAction.SCALE_DOWN, 300
        ),
        "queue_high": ScaleTrigger(
            "queue_high", "queue_depth", float(QUEUE_DEPTH_SCALE), ScaleAction.ADD_WORKERS, 60
        ),
        "memory_critical": ScaleTrigger(
            "memory_critical",
            "memory_usage",
            MEMORY_ALERT,
            ScaleAction.STATIC_FALLBACK,
            0,  # Immediate
        ),
        "viral_detected": ScaleTrigger(
            "viral_detected",
            "requests_per_second",
            1000.0,
            ScaleAction.ENABLE_CDN,
            30,
        ),
    }

def get_default_degradation_rules() -> Dict[str, DegradationRule]:
    """Get default degradation rules."""
    return {
        "real_time_analytics": DegradationRule(
            "real_time_analytics",
            DefenseLevel.YELLOW,
            fallback_value={"message": "Analytics delayed"},
            description="Real-time analytics - defer to batch",
        ),
        "ai_features": DegradationRule(
            "ai_features",
            DefenseLevel.YELLOW,
            fallback_value=None,
            description="AI-powered features",
        ),
        "image_generation": DegradationRule(
            "image_generation",
            DefenseLevel.ORANGE,
            fallback_value={"url": "/static/placeholder.png"},
            description="Dynamic image generation",
        ),
        "search": DegradationRule(
            "search",
            DefenseLevel.ORANGE,
            fallback_value={
                "results": [],
                "message": "Search temporarily unavailable",
            },
            description="Full-text search",
        ),
        "webhooks": DegradationRule(
            "webhooks",
            DefenseLevel.RED,
            fallback_value={"queued": True},
            description="Webhook processing - queue only",
        ),
    }

STATIC_FALLBACK_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>AgencyOS - High Traffic Mode</title>
    <style>
        body { font-family: system-ui; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #333; }
        p { color: #666; }
        .status { background: #f0f0f0; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 We're Going Viral!</h1>
        <div class="status">
            <p>Traffic is exceptionally high right now.</p>
            <p>We're scaling up to handle the load.</p>
            <p>Please refresh in a few minutes.</p>
        </div>
        <p><small>AgencyOS - Built for Scale</small></p>
    </div>
</body>
</html>
"""
