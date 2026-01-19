# Phase 09: Backend API Layer Refactoring

**Timeline:** Phase 9 (Week 3)
**Impact:** API maintainability + configuration management
**Priority:** P1

---

## 📋 CONTEXT

**Parent Plan:** `/Users/macbookprom1/mekong-cli/plans/260117-0029-refactor-for-golive/plan.md`
**Dependencies:** Phase 8 (core business logic patterns)
**Related Docs:** `docs/system-architecture.md`, `backend/api/README.md`

---

## 🎯 OVERVIEW

**Date:** 2026-01-19
**Description:** Extract hardcoded configs, unify duplicate logic, consolidate Pydantic models, add validation layer
**Priority:** P1
**Status:** Pending

---

## 🔑 KEY INSIGHTS

From scout report:

1. **20+ Hardcoded Values**: URLs, secrets, rate limits, timeouts, DB paths scattered across API layer
2. **Duplicate Logic**: Endpoint categorization in metrics.py AND rate_limiting.py
3. **Pydantic Duplication**: VibeRequest/Response in schemas.py AND models/vibe.py
4. **Missing Validation**: API routers import Pydantic but don't use validators
5. **Config Gaps**: SECRET_KEY default "super-secret-key-change-in-production" in config.py

---

## 📊 REQUIREMENTS

### Deliverables

1. **Centralize Configuration**
   - Extract all hardcoded values to `backend/api/config/settings.py`
   - Use Pydantic Settings for validation
   - Environment-specific configs (dev/staging/prod)

2. **Unify Duplicate Logic**
   - Create shared `backend/api/utils/endpoint_categorization.py`
   - Remove duplication from metrics.py + rate_limiting.py

3. **Consolidate Pydantic Models**
   - Single source in `backend/api/schemas/`
   - Delete duplicates from `backend/models/`

4. **Add Input Validation Layer**
   - Middleware for request validation
   - Error response standardization
   - Security sanitization

---

## 🏗️ ARCHITECTURE

### Current Structure (Scattered Config)
```
backend/api/
├── config.py                 # Hardcoded SECRET_KEY, CORS
├── main.py                   # Hardcoded CORS origins
├── middleware/
│   ├── metrics.py            # _extract_endpoint() - DUPLICATE
│   ├── rate_limiting.py      # get_endpoint_category() - DUPLICATE
│   │                         # Hardcoded PLAN_LIMITS
│   └── multitenant.py        # Hardcoded TENANT_STORE, sqlite paths
├── routers/
│   ├── webhooks.py           # Hardcoded portal URL
│   │                         # generate_license_key() - DUPLICATE
│   └── code.py               # Hardcoded version "1.0.0"
├── schemas.py                # VibeRequest/Response - DUPLICATE
└── models/
    └── vibe.py               # VibeRequest/Response - DUPLICATE

tunnel.py                     # Hardcoded http://localhost:8000
```

### Target Structure (Centralized Config)
```
backend/api/
├── config/
│   ├── __init__.py
│   ├── settings.py           # Pydantic Settings (all configs)
│   ├── environments/
│   │   ├── development.yaml
│   │   ├── staging.yaml
│   │   └── production.yaml
│   └── constants.py          # Shared constants
├── middleware/
│   ├── metrics.py            # Uses shared utils
│   ├── rate_limiting.py      # Uses shared utils
│   ├── multitenant.py        # Uses config.settings
│   └── validation.py         # NEW: Input validation
├── routers/
│   ├── webhooks.py           # Uses core.licensing
│   └── [others]              # Use config.settings
├── schemas/                  # SINGLE source
│   ├── __init__.py
│   ├── vibe.py
│   ├── webhooks.py
│   └── common.py
├── utils/
│   ├── endpoint_categorization.py  # Shared logic
│   └── validators.py         # Reusable validators
└── main.py                   # Uses config.settings
```

---

## 📂 RELATED CODE FILES

| File | Lines | Issues |
|------|-------|--------|
| `backend/api/config.py` | 30 | Hardcoded SECRET_KEY, CORS |
| `backend/api/main.py` | 137 | Hardcoded CORS origins |
| `backend/api/middleware/metrics.py` | 230 | Hardcoded buckets, duplicate logic |
| `backend/api/middleware/rate_limiting.py` | 222 | Hardcoded limits, duplicate logic |
| `backend/api/middleware/multitenant.py` | 207 | In-memory store, hardcoded paths |
| `backend/api/routers/webhooks.py` | 209 | Hardcoded URL, duplicate license gen |
| `backend/api/tunnel.py` | 406 | Hardcoded localhost:8000, magic numbers |

---

## 🛠️ IMPLEMENTATION STEPS

### Step 1: Centralize Configuration (6h)

**1.1 Create Pydantic Settings**
```python
# backend/api/config/settings.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Dict
from pathlib import Path

class Settings(BaseSettings):
    """Centralized configuration with validation"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

    # Security
    secret_key: str  # REQUIRED - no default
    allowed_hosts: List[str] = ["*"]
    cors_origins: List[str] = []

    # Database
    database_url: str = "sqlite:///./agencyos.db"
    redis_url: str = "redis://localhost:6379"

    # Rate Limiting
    rate_limit_free: int = 100
    rate_limit_pro: int = 500
    rate_limit_enterprise: int = 1000

    # Timeouts (seconds)
    cache_ttl_fast: int = 5
    cache_ttl_medium: int = 10
    cache_ttl_slow: int = 30
    request_timeout: int = 30

    # Metrics
    slow_request_threshold: float = 0.1  # 100ms
    fast_response_threshold: float = 0.05  # 50ms
    metrics_buckets: List[float] = [0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]

    # Webhooks
    polar_webhook_secret: str = ""
    webhook_portal_url: str = "https://platform.billmentor.com"

    # API
    api_version: str = "1.0.0"
    backend_url: str = "http://localhost:8000"

    # Tenant
    default_tenant: str = "default"

    # Environment
    environment: str = "development"
    debug: bool = False

# Singleton instance
settings = Settings()
```

**1.2 Create environment configs**
```yaml
# backend/api/config/environments/production.yaml
environment: production
debug: false
allowed_hosts:
  - "api.agencyos.network"
  - "platform.billmentor.com"
cors_origins:
  - "https://agencyos.network"
  - "https://app.billmentor.com"
backend_url: "https://api.agencyos.network"
```

**1.3 Migrate existing configs**
```python
# backend/api/config.py (DELETE after migration)
# backend/api/main.py (UPDATE)
from backend.api.config.settings import settings

app = FastAPI(
    title="AgencyOS API",
    version=settings.api_version,
    debug=settings.debug
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
```

### Step 2: Unify Duplicate Logic (4h)

**2.1 Create shared endpoint categorization**
```python
# backend/api/utils/endpoint_categorization.py
from enum import Enum
from typing import Optional

class EndpointCategory(Enum):
    AUTH = "auth"
    AGENT = "agent"
    VIBE = "vibe"
    WEBHOOK = "webhook"
    HEALTH = "health"
    DOCS = "docs"
    STATIC = "static"

def categorize_endpoint(path: str, method: str) -> EndpointCategory:
    """
    Unified endpoint categorization logic
    Used by metrics.py and rate_limiting.py
    """
    # Normalize path
    path = path.lower().strip("/")

    # Exact matches
    if path in ["health", "ping", "ready"]:
        return EndpointCategory.HEALTH

    if path.startswith("docs") or path.startswith("redoc"):
        return EndpointCategory.DOCS

    # Prefix matches
    if path.startswith("auth"):
        return EndpointCategory.AUTH

    if path.startswith("agent") or path.startswith("vibe/agent"):
        return EndpointCategory.AGENT

    if path.startswith("vibe"):
        return EndpointCategory.VIBE

    if path.startswith("webhook"):
        return EndpointCategory.WEBHOOK

    if path.startswith("static"):
        return EndpointCategory.STATIC

    # Default
    return EndpointCategory.VIBE

def extract_endpoint_name(path: str) -> str:
    """
    Extract clean endpoint name for metrics
    Removes IDs, query params, etc.
    """
    # Remove query params
    path = path.split("?")[0]

    # Replace UUIDs/IDs with placeholder
    import re
    path = re.sub(r'/[0-9a-f-]{32,}', '/{id}', path)
    path = re.sub(r'/\d+', '/{id}', path)

    return path
```

**2.2 Update metrics.py**
```python
# backend/api/middleware/metrics.py
from backend.api.config.settings import settings
from backend.api.utils.endpoint_categorization import (
    categorize_endpoint,
    extract_endpoint_name
)

class MetricsMiddleware:
    def __init__(self):
        # Use config instead of hardcoded values
        self.slow_threshold = settings.slow_request_threshold
        self.buckets = settings.metrics_buckets

        self.histogram = Histogram(
            "http_request_duration_seconds",
            "HTTP request latency",
            ["method", "endpoint", "status"],
            buckets=self.buckets
        )

    async def __call__(self, request: Request, call_next):
        start_time = time.time()

        # Use shared categorization
        category = categorize_endpoint(request.url.path, request.method)
        endpoint_name = extract_endpoint_name(request.url.path)

        response = await call_next(request)

        duration = time.time() - start_time
        self.histogram.labels(
            method=request.method,
            endpoint=endpoint_name,
            status=response.status_code
        ).observe(duration)

        return response
```

**2.3 Update rate_limiting.py**
```python
# backend/api/middleware/rate_limiting.py
from backend.api.config.settings import settings
from backend.api.utils.endpoint_categorization import (
    categorize_endpoint,
    EndpointCategory
)

# Use config for plan limits
PLAN_LIMITS = {
    "free": settings.rate_limit_free,
    "pro": settings.rate_limit_pro,
    "enterprise": settings.rate_limit_enterprise
}

async def rate_limit_middleware(request: Request, call_next):
    # Use shared categorization
    category = categorize_endpoint(request.url.path, request.method)

    # Skip rate limiting for health/docs
    if category in [EndpointCategory.HEALTH, EndpointCategory.DOCS]:
        return await call_next(request)

    # Apply rate limiting based on user plan
    user_plan = get_user_plan(request)  # From auth
    limit = PLAN_LIMITS.get(user_plan, PLAN_LIMITS["free"])

    # Rate limit logic...
```

### Step 3: Consolidate Pydantic Models (3h)

**3.1 Single source in schemas/**
```python
# backend/api/schemas/vibe.py
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime

class VibeRequest(BaseModel):
    """SINGLE source of truth for Vibe requests"""

    task: str = Field(..., min_length=1, max_length=1000)
    context: Optional[Dict[str, Any]] = None
    priority: int = Field(default=5, ge=1, le=10)

    @validator('task')
    def sanitize_task(cls, v):
        """Sanitize task input"""
        return v.strip()

class VibeResponse(BaseModel):
    """SINGLE source of truth for Vibe responses"""

    task_id: str
    status: str
    result: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
```

**3.2 Delete duplicates**
```bash
# Remove duplicate model file
rm backend/models/vibe.py

# Update imports across codebase
# Before: from backend.models.vibe import VibeRequest
# After:  from backend.api.schemas.vibe import VibeRequest
```

**3.3 Consolidate in schemas/__init__.py**
```python
# backend/api/schemas/__init__.py
from .vibe import VibeRequest, VibeResponse
from .webhooks import WebhookPayload
from .common import ErrorResponse, SuccessResponse

__all__ = [
    "VibeRequest",
    "VibeResponse",
    "WebhookPayload",
    "ErrorResponse",
    "SuccessResponse"
]
```

### Step 4: Add Input Validation Layer (5h)

**4.1 Create validation middleware**
```python
# backend/api/middleware/validation.py
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from pydantic import ValidationError
import logging

logger = logging.getLogger(__name__)

class ValidationMiddleware:
    """Input validation and sanitization middleware"""

    async def __call__(self, request: Request, call_next):
        try:
            # Validate content type for POST/PUT
            if request.method in ["POST", "PUT", "PATCH"]:
                content_type = request.headers.get("content-type", "")
                if not content_type.startswith("application/json"):
                    return JSONResponse(
                        status_code=415,
                        content={"error": "Content-Type must be application/json"}
                    )

            # Process request
            response = await call_next(request)
            return response

        except ValidationError as e:
            logger.warning(f"Validation error: {e}")
            return JSONResponse(
                status_code=422,
                content={
                    "error": "Validation failed",
                    "details": e.errors()
                }
            )

        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return JSONResponse(
                status_code=500,
                content={"error": "Internal server error"}
            )
```

**4.2 Add request sanitization**
```python
# backend/api/utils/validators.py
import re
import bleach
from typing import Any, Dict

def sanitize_html(text: str) -> str:
    """Remove HTML tags from user input"""
    return bleach.clean(text, tags=[], strip=True)

def sanitize_sql(text: str) -> str:
    """Basic SQL injection prevention"""
    # Remove common SQL keywords
    dangerous_patterns = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)",
        r"(--|\;|\/\*|\*\/)",
    ]

    for pattern in dangerous_patterns:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)

    return text

def validate_json_depth(data: Dict[str, Any], max_depth: int = 10) -> bool:
    """Prevent deeply nested JSON (DoS protection)"""
    def _depth(obj, current_depth=0):
        if current_depth > max_depth:
            return False

        if isinstance(obj, dict):
            return all(_depth(v, current_depth + 1) for v in obj.values())
        elif isinstance(obj, list):
            return all(_depth(item, current_depth + 1) for item in obj)

        return True

    return _depth(data)
```

**4.3 Apply validation in routers**
```python
# backend/api/routers/code.py
from backend.api.schemas.vibe import VibeRequest, VibeResponse
from backend.api.utils.validators import sanitize_html, validate_json_depth
from backend.api.config.settings import settings

@router.post("/execute", response_model=VibeResponse)
async def execute_code(request: VibeRequest):
    """Execute code with validated input"""

    # Sanitize input
    request.task = sanitize_html(request.task)

    # Validate JSON depth (DoS prevention)
    if request.context and not validate_json_depth(request.context):
        raise HTTPException(
            status_code=400,
            detail="JSON nesting too deep"
        )

    # Execute (now safe)
    result = await code_executor.execute(request)

    return VibeResponse(
        task_id=result.id,
        status="success",
        result=result.data,
        created_at=datetime.now()
    )
```

---

## ✅ TODO

- [ ] Create Pydantic settings.py with all configs (6h)
- [ ] Extract endpoint categorization to shared utils (4h)
- [ ] Consolidate Pydantic models in schemas/ (3h)
- [ ] Implement validation middleware (5h)
- [ ] Update all routers to use config.settings (4h)
- [ ] Write tests for validation layer (4h)
- [ ] Security audit (2h)

**Total:** 28 hours

---

## 📊 SUCCESS CRITERIA

- ✅ Hardcoded configs: 20+ → 0
- ✅ Duplicate logic: 2 implementations → 1 shared util
- ✅ Pydantic models: 2 sources → 1 schemas/
- ✅ Input validation: 0% → 100% coverage
- ✅ Config validation: Pydantic enforces types
- ✅ SECRET_KEY: No default value (required in env)

---

## ⚠️ RISK ASSESSMENT

**Medium Risk:** Config migration could break existing deployments
**Mitigation:** Backward compatibility layer, gradual rollout

**Low Risk:** Validation could reject valid edge cases
**Mitigation:** Comprehensive testing, sanitization over rejection

---

## 🔒 SECURITY CONSIDERATIONS

**Critical:**
- SECRET_KEY must be required (no default)
- Input sanitization prevents XSS/SQL injection
- JSON depth validation prevents DoS
- CORS origins validated in production

---

_Phase 9: API layer optimization for configuration management and security_
