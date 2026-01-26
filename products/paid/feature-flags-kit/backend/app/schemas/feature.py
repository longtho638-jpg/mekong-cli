from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class FeatureFlagBase(BaseModel):
    key: str = Field(..., description="Unique key for the feature flag (e.g., 'new-checkout')")
    description: Optional[str] = None
    is_active: bool = Field(True, description="Global on/off switch")
    targeting_rules: List[Dict[str, Any]] = Field(default_factory=list, description="List of rules for targeting")

class FeatureFlagCreate(FeatureFlagBase):
    pass

class FeatureFlagUpdate(BaseModel):
    description: Optional[str] = None
    is_active: Optional[bool] = None
    targeting_rules: Optional[List[Dict[str, Any]]] = None

class FeatureFlagResponse(FeatureFlagBase):
    id: int

    class Config:
        from_attributes = True

class EvaluationContext(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    custom: Dict[str, Any] = Field(default_factory=dict)

class EvaluationRequest(BaseModel):
    context: EvaluationContext
    environment: str = "prod" # For future multi-env support
