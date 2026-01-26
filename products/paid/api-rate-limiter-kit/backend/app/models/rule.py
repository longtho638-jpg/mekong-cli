from pydantic import BaseModel, Field
from typing import Optional, Literal

class RateLimitRule(BaseModel):
    path: str = Field(..., description="API path pattern (e.g., /api/v1/users)")
    method: str = Field(..., description="HTTP method (GET, POST, etc.)")
    limit: int = Field(..., gt=0, description="Max requests allowed")
    window: int = Field(..., gt=0, description="Time window in seconds")
    strategy: Literal["fixed", "sliding"] = Field("fixed", description="Rate limiting strategy")

    class Config:
        json_schema_extra = {
            "example": {
                "path": "/api/v1/login",
                "method": "POST",
                "limit": 5,
                "window": 60,
                "strategy": "fixed"
            }
        }

class RuleCreate(RateLimitRule):
    pass

class RuleUpdate(BaseModel):
    limit: Optional[int] = Field(None, gt=0)
    window: Optional[int] = Field(None, gt=0)
    strategy: Optional[Literal["fixed", "sliding"]] = None
