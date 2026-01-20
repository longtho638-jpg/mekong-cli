"""
Data models and Enums for Testimonials.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, Optional


class Rating(Enum):
    """Star rating."""
    ONE = 1
    TWO = 2
    THREE = 3
    FOUR = 4
    FIVE = 5

@dataclass
class Testimonial:
    """A client testimonial."""
    client_name: str
    company: str
    role: str
    rating: Rating
    quote: str
    results: Dict[str, str]
    date: datetime = field(default_factory=datetime.now)
    photo_url: Optional[str] = None
