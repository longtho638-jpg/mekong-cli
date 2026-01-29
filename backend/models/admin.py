from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class FeatureFlag(BaseModel):
    key: str
    enabled: bool
    description: Optional[str] = None
    environment: str = "production"
    rules: Optional[Dict[str, Any]] = {}
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class FeatureFlagCreate(BaseModel):
    key: str
    enabled: bool
    description: Optional[str] = None
    environment: str = "production"
    rules: Optional[Dict[str, Any]] = {}


class FeatureFlagUpdate(BaseModel):
    enabled: Optional[bool] = None
    description: Optional[str] = None
    rules: Optional[Dict[str, Any]] = None


class SystemSetting(BaseModel):
    key: str
    value: Dict[str, Any]
    description: Optional[str] = None
    is_encrypted: bool = False
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None


class SystemSettingUpdate(BaseModel):
    value: Dict[str, Any]
    description: Optional[str] = None


class AdminUser(BaseModel):
    id: str
    email: str
    role: str
    created_at: datetime
    last_sign_in_at: Optional[datetime] = None
    app_metadata: Dict[str, Any] = {}
    user_metadata: Dict[str, Any] = {}
    banned_until: Optional[datetime] = None


class AdminUserUpdate(BaseModel):
    role: Optional[str] = None
    password: Optional[str] = None
    ban_duration: Optional[str] = None  # e.g. "7d", "forever", "none"


class AdminAuditLog(BaseModel):
    id: str
    actor_id: str
    actor_type: str
    action: str
    resource: Optional[str]
    status: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    metadata: Dict[str, Any] = {}
    created_at: datetime
