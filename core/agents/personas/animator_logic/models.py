"""
Animation data models.
"""
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum


class AnimationType(Enum):
    MOTION_GRAPHICS = "motion_graphics"
    CHARACTER_2D = "character_2d"
    CHARACTER_3D = "character_3d"
    UI_ANIMATION = "ui_animation"
    LOGO_REVEAL = "logo_reveal"
    EXPLAINER = "explainer"

class AnimationStatus(Enum):
    STORYBOARD = "storyboard"
    ANIMATING = "animating"
    RENDERING = "rendering"
    REVIEW = "review"
    DELIVERED = "delivered"

@dataclass
class AnimationProject:
    id: str
    name: str
    client: str
    anim_type: AnimationType
    duration_seconds: int
    fps: int = 30
    status: AnimationStatus = AnimationStatus.STORYBOARD
    animator: str = ""
    deadline: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=14))

    @property
    def total_frames(self) -> int:
        return self.duration_seconds * self.fps
