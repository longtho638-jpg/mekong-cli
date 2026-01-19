# Phase 08: Core Business Logic Refactoring

**Timeline:** Phase 8 (Week 3)
**Impact:** System stability + maintainability
**Priority:** P0

---

## 📋 CONTEXT

**Parent Plan:** `/Users/macbookprom1/mekong-cli/plans/260117-0029-refactor-for-golive/plan.md`
**Dependencies:** Phase 6 (infrastructure), Phase 7 (CLI patterns)
**Related Docs:** `docs/system-architecture.md`, `docs/code-standards.md`

---

## 🎯 OVERVIEW

**Date:** 2026-01-19
**Description:** Decompose monolithic core business logic files (control_enhanced.py 672 lines, knowledge_graph.py 429 lines, agent_chains.py 353 lines)
**Priority:** P0 (system stability)
**Status:** Pending

---

## 🔑 KEY INSIGHTS

From scout report:

1. **control_enhanced.py (672 lines)**: CRITICAL - 34% over 500-line hard limit, 4 daemon threads, complex Redis integration
2. **knowledge_graph.py (429 lines)**: Performance bottleneck - memory growth on large codebases, no indexing limits
3. **agent_chains.py (353 lines)**: 275+ lines of static chain definitions, no validation
4. **money_maker.py (293 lines)**: Financial calculations without input validation, hardcoded pricing

---

## 📊 REQUIREMENTS

### Deliverables

1. **Split control_enhanced.py (672 → 4 modules)**
   - `core/control/redis_client.py` (~200 lines)
   - `core/control/feature_flags.py` (~150 lines)
   - `core/control/circuit_breaker.py` (~150 lines)
   - `core/control/analytics.py` (~150 lines)

2. **Split knowledge_graph.py (429 → 3 modules)**
   - `core/knowledge/entity_extractor.py` (~150 lines)
   - `core/knowledge/search_engine.py` (~150 lines)
   - `core/knowledge/ast_parser.py` (~100 lines)

3. **Refactor agent_chains.py (353 → config-driven)**
   - Extract definitions to `core/config/chains.yaml`
   - Add validation schema
   - Reduce to ~80 lines loader logic

4. **Add Input Validation to money_maker.py**
   - Pydantic models for financial calculations
   - Extract pricing tables to config
   - Add fraud detection rules

---

## 🏗️ ARCHITECTURE

### Current Structure (Problematic)
```
antigravity/core/
├── control_enhanced.py    # 672 lines - CRITICAL VIOLATION
│   ├── Redis integration
│   ├── Feature flags
│   ├── Circuit breakers
│   ├── Analytics tracking
│   └── 4 daemon threads
├── knowledge_graph.py     # 429 lines - Performance bottleneck
│   ├── AST parsing
│   ├── Entity extraction
│   ├── Search engine
│   └── Global singleton
├── agent_chains.py        # 353 lines - Hardcoded config
│   └── 275+ lines of static definitions
└── money_maker.py         # 293 lines - Security risk
    ├── Financial calculations
    ├── Hardcoded pricing
    └── No input validation
```

### Target Structure (Modular)
```
antigravity/core/
├── control/
│   ├── __init__.py
│   ├── redis_client.py      # Redis operations
│   ├── feature_flags.py     # A/B testing, rollouts
│   ├── circuit_breaker.py   # Failure isolation
│   └── analytics.py         # Event tracking
├── knowledge/
│   ├── __init__.py
│   ├── entity_extractor.py  # AST parsing, entity discovery
│   ├── search_engine.py     # Indexing, querying
│   └── ast_parser.py        # Code analysis
├── config/
│   ├── chains.yaml          # Agent chain definitions
│   └── pricing.yaml         # Pricing tables
├── chains/
│   ├── __init__.py
│   ├── loader.py            # YAML → chain objects
│   ├── validator.py         # Schema validation
│   └── registry.py          # Chain registration
└── finance/
    ├── money_maker.py       # Refactored with validation
    ├── validators.py        # Input validation models
    └── fraud_detection.py   # Security rules
```

---

## 📂 RELATED CODE FILES

| File | Lines | Issues | Priority |
|------|-------|--------|----------|
| `core/control_enhanced.py` | 672 | 34% over limit, threading, Redis | **P0** |
| `core/knowledge_graph.py` | 429 | Memory growth, no limits | **P0** |
| `core/agent_chains.py` | 353 | Hardcoded config | **P0** |
| `core/money_maker.py` | 293 | No validation, security | **P1** |
| `core/control.py` | 292 | Thread safety | **P1** |
| `core/agent_crews.py` | 258 | time.sleep() in loops | **P2** |
| `core/proposal_generator.py` | 258 | Large template strings | **P2** |

---

## 🛠️ IMPLEMENTATION STEPS

### Step 1: Split control_enhanced.py (12h)

**1.1 Extract Redis Client**
```python
# core/control/redis_client.py
import redis
from typing import Optional, Any
import json

class RedisClient:
    """Centralized Redis operations"""

    def __init__(self, url: str, pool_size: int = 10):
        self.pool = redis.ConnectionPool.from_url(
            url, max_connections=pool_size
        )
        self.client = redis.Redis(connection_pool=self.pool)

    def get(self, key: str) -> Optional[Any]:
        """Get value with JSON deserialization"""
        value = self.client.get(key)
        return json.loads(value) if value else None

    def set(self, key: str, value: Any, ttl: int = 3600):
        """Set value with JSON serialization"""
        self.client.setex(key, ttl, json.dumps(value))

    def delete(self, key: str):
        """Delete key"""
        self.client.delete(key)

    def health_check(self) -> bool:
        """Check Redis connectivity"""
        try:
            self.client.ping()
            return True
        except redis.ConnectionError:
            return False
```

**1.2 Extract Feature Flags**
```python
# core/control/feature_flags.py
from dataclasses import dataclass
from typing import Dict, Optional
from core.control.redis_client import RedisClient

@dataclass
class FeatureFlag:
    name: str
    enabled: bool
    rollout_percentage: int = 100
    user_whitelist: list = None

class FeatureFlagManager:
    """Feature flag management with Redis backend"""

    def __init__(self, redis_client: RedisClient):
        self.redis = redis_client
        self.cache: Dict[str, FeatureFlag] = {}

    def is_enabled(self, flag_name: str, user_id: Optional[str] = None) -> bool:
        """Check if feature is enabled for user"""
        flag = self._get_flag(flag_name)
        if not flag:
            return False

        # Check whitelist
        if flag.user_whitelist and user_id:
            return user_id in flag.user_whitelist

        # Check rollout percentage
        if flag.rollout_percentage < 100:
            return self._is_in_rollout(user_id, flag.rollout_percentage)

        return flag.enabled

    def _get_flag(self, name: str) -> Optional[FeatureFlag]:
        """Get flag from cache or Redis"""
        if name in self.cache:
            return self.cache[name]

        data = self.redis.get(f"feature_flag:{name}")
        if data:
            flag = FeatureFlag(**data)
            self.cache[name] = flag
            return flag

        return None

    def _is_in_rollout(self, user_id: str, percentage: int) -> bool:
        """Deterministic rollout based on user_id hash"""
        if not user_id:
            return False
        hash_val = hash(user_id) % 100
        return hash_val < percentage
```

**1.3 Extract Circuit Breaker**
```python
# core/control/circuit_breaker.py
from enum import Enum
from datetime import datetime, timedelta
from typing import Callable, Any
import threading

class CircuitState(Enum):
    CLOSED = "closed"       # Normal operation
    OPEN = "open"           # Blocking requests
    HALF_OPEN = "half_open" # Testing recovery

class CircuitBreaker:
    """Circuit breaker pattern for fault tolerance"""

    def __init__(
        self,
        failure_threshold: int = 5,
        timeout: int = 60,
        expected_exception: type = Exception
    ):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.expected_exception = expected_exception

        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED
        self.lock = threading.Lock()

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection"""
        with self.lock:
            if self.state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    self.state = CircuitState.HALF_OPEN
                else:
                    raise Exception("Circuit breaker is OPEN")

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result

        except self.expected_exception as e:
            self._on_failure()
            raise e

    def _on_success(self):
        """Reset on successful call"""
        with self.lock:
            self.failure_count = 0
            self.state = CircuitState.CLOSED

    def _on_failure(self):
        """Handle failure"""
        with self.lock:
            self.failure_count += 1
            self.last_failure_time = datetime.now()

            if self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN

    def _should_attempt_reset(self) -> bool:
        """Check if timeout has passed"""
        return (
            self.last_failure_time and
            datetime.now() - self.last_failure_time > timedelta(seconds=self.timeout)
        )
```

**1.4 Extract Analytics**
```python
# core/control/analytics.py
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Dict, Any
from core.control.redis_client import RedisClient

@dataclass
class AnalyticsEvent:
    event_name: str
    user_id: str
    timestamp: datetime
    properties: Dict[str, Any]

class AnalyticsTracker:
    """Event tracking with Redis backend"""

    def __init__(self, redis_client: RedisClient):
        self.redis = redis_client

    def track(self, event: AnalyticsEvent):
        """Track analytics event"""
        key = f"analytics:{event.event_name}:{event.timestamp.date()}"

        # Increment counter
        self.redis.client.hincrby(key, "count", 1)

        # Store event details
        event_data = asdict(event)
        event_data['timestamp'] = event.timestamp.isoformat()

        self.redis.client.lpush(
            f"analytics:events:{event.event_name}",
            json.dumps(event_data)
        )

    def get_metrics(self, event_name: str, date: datetime.date) -> Dict[str, int]:
        """Get metrics for event on specific date"""
        key = f"analytics:{event_name}:{date}"
        return self.redis.client.hgetall(key)
```

**1.5 Refactor control_enhanced.py**
```python
# core/control_enhanced.py (now ~100 lines)
from core.control.redis_client import RedisClient
from core.control.feature_flags import FeatureFlagManager
from core.control.circuit_breaker import CircuitBreaker
from core.control.analytics import AnalyticsTracker

class EnhancedControl:
    """Orchestrates control components"""

    def __init__(self, redis_url: str):
        self.redis = RedisClient(redis_url)
        self.feature_flags = FeatureFlagManager(self.redis)
        self.circuit_breaker = CircuitBreaker()
        self.analytics = AnalyticsTracker(self.redis)

    # High-level coordination methods only
```

### Step 2: Split knowledge_graph.py (8h)

**2.1 Extract Entity Extractor**
```python
# core/knowledge/entity_extractor.py
import ast
from typing import List, Dict, Any
from pathlib import Path

class EntityExtractor:
    """Extract code entities using AST parsing"""

    def extract_from_file(self, file_path: Path) -> Dict[str, List[Any]]:
        """Extract functions, classes, imports from Python file"""
        with open(file_path) as f:
            tree = ast.parse(f.read())

        return {
            'functions': self._extract_functions(tree),
            'classes': self._extract_classes(tree),
            'imports': self._extract_imports(tree)
        }

    def _extract_functions(self, tree: ast.AST) -> List[Dict[str, Any]]:
        """Extract function definitions"""
        functions = []
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                functions.append({
                    'name': node.name,
                    'lineno': node.lineno,
                    'args': [arg.arg for arg in node.args.args],
                    'docstring': ast.get_docstring(node)
                })
        return functions

    def _extract_classes(self, tree: ast.AST) -> List[Dict[str, Any]]:
        """Extract class definitions"""
        classes = []
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                classes.append({
                    'name': node.name,
                    'lineno': node.lineno,
                    'bases': [base.id for base in node.bases if isinstance(base, ast.Name)],
                    'methods': [m.name for m in node.body if isinstance(m, ast.FunctionDef)]
                })
        return classes

    def _extract_imports(self, tree: ast.AST) -> List[str]:
        """Extract import statements"""
        imports = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.extend([alias.name for alias in node.names])
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ''
                imports.extend([f"{module}.{alias.name}" for alias in node.names])
        return imports
```

**2.2 Extract Search Engine**
```python
# core/knowledge/search_engine.py
from typing import List, Dict, Any
from dataclasses import dataclass
import re

@dataclass
class SearchResult:
    entity_type: str
    name: str
    file_path: str
    lineno: int
    score: float

class SearchEngine:
    """Index and search code entities"""

    def __init__(self, max_index_size: int = 10000):
        self.max_index_size = max_index_size
        self.index: Dict[str, List[Dict[str, Any]]] = {}
        self.entity_count = 0

    def add_entity(self, entity_type: str, entity: Dict[str, Any], file_path: str):
        """Add entity to index with size limit"""
        if self.entity_count >= self.max_index_size:
            self._evict_oldest()

        key = f"{entity_type}:{entity['name']}"
        if key not in self.index:
            self.index[key] = []

        self.index[key].append({
            **entity,
            'file_path': file_path,
            'entity_type': entity_type
        })
        self.entity_count += 1

    def search(self, query: str, entity_type: str = None) -> List[SearchResult]:
        """Search indexed entities"""
        results = []
        pattern = re.compile(query, re.IGNORECASE)

        for key, entities in self.index.items():
            if entity_type and not key.startswith(f"{entity_type}:"):
                continue

            for entity in entities:
                if pattern.search(entity['name']):
                    score = self._calculate_score(query, entity['name'])
                    results.append(SearchResult(
                        entity_type=entity['entity_type'],
                        name=entity['name'],
                        file_path=entity['file_path'],
                        lineno=entity.get('lineno', 0),
                        score=score
                    ))

        return sorted(results, key=lambda r: r.score, reverse=True)

    def _calculate_score(self, query: str, name: str) -> float:
        """Simple scoring: exact match > starts with > contains"""
        if query.lower() == name.lower():
            return 1.0
        elif name.lower().startswith(query.lower()):
            return 0.8
        else:
            return 0.5

    def _evict_oldest(self):
        """Evict oldest entry when limit reached"""
        if self.index:
            oldest_key = next(iter(self.index))
            del self.index[oldest_key]
            self.entity_count -= 1
```

**2.3 Refactor knowledge_graph.py**
```python
# core/knowledge_graph.py (now ~100 lines)
from core.knowledge.entity_extractor import EntityExtractor
from core.knowledge.search_engine import SearchEngine
from pathlib import Path

class KnowledgeGraph:
    """High-level knowledge graph orchestration"""

    def __init__(self, max_index_size: int = 10000):
        self.extractor = EntityExtractor()
        self.search = SearchEngine(max_index_size)

    def index_codebase(self, root_path: Path):
        """Index entire codebase with memory limit"""
        for py_file in root_path.rglob("*.py"):
            entities = self.extractor.extract_from_file(py_file)

            for func in entities['functions']:
                self.search.add_entity('function', func, str(py_file))

            for cls in entities['classes']:
                self.search.add_entity('class', cls, str(py_file))

    # High-level API methods only
```

### Step 3: Config-Driven agent_chains.py (6h)

**3.1 Create chains.yaml**
```yaml
# core/config/chains.yaml
chains:
  - name: fullstack-developer
    description: End-to-end feature development
    agents:
      - name: frontend-developer
        role: UI implementation
        tools: [React, TypeScript, TailwindCSS]
      - name: backend-developer
        role: API implementation
        tools: [FastAPI, PostgreSQL, Redis]
      - name: tester
        role: Quality assurance
        tools: [Pytest, Playwright]

  - name: money-maker
    description: Revenue optimization
    agents:
      - name: pricing-analyst
        role: Pricing strategy
      - name: conversion-optimizer
        role: CRO implementation
      - name: payment-integrator
        role: Payment systems

  - name: content-factory
    description: Content generation
    agents:
      - name: copywriter
        role: Marketing copy
      - name: technical-writer
        role: Documentation
```

**3.2 Create chain loader**
```python
# core/chains/loader.py
import yaml
from pathlib import Path
from typing import Dict, List
from dataclasses import dataclass

@dataclass
class Agent:
    name: str
    role: str
    tools: List[str] = None

@dataclass
class Chain:
    name: str
    description: str
    agents: List[Agent]

class ChainLoader:
    """Load agent chains from YAML config"""

    def __init__(self, config_path: Path):
        self.config_path = config_path
        self.chains: Dict[str, Chain] = {}
        self._load_config()

    def _load_config(self):
        """Load and parse chains.yaml"""
        with open(self.config_path) as f:
            config = yaml.safe_load(f)

        for chain_def in config['chains']:
            agents = [
                Agent(**agent_def)
                for agent_def in chain_def['agents']
            ]

            chain = Chain(
                name=chain_def['name'],
                description=chain_def['description'],
                agents=agents
            )

            self.chains[chain.name] = chain

    def get_chain(self, name: str) -> Chain:
        """Get chain by name"""
        if name not in self.chains:
            raise ValueError(f"Unknown chain: {name}")
        return self.chains[name]

    def list_chains(self) -> List[str]:
        """List available chains"""
        return list(self.chains.keys())
```

**3.3 Add validation**
```python
# core/chains/validator.py
from pathlib import Path
from typing import List

class ChainValidator:
    """Validate chain definitions"""

    def validate_config(self, config_path: Path) -> List[str]:
        """Validate chains.yaml and return errors"""
        errors = []

        with open(config_path) as f:
            config = yaml.safe_load(f)

        # Check required fields
        if 'chains' not in config:
            errors.append("Missing 'chains' key")
            return errors

        for i, chain in enumerate(config['chains']):
            chain_name = chain.get('name', f'chain_{i}')

            if 'name' not in chain:
                errors.append(f"{chain_name}: Missing 'name'")

            if 'agents' not in chain:
                errors.append(f"{chain_name}: Missing 'agents'")
            elif len(chain['agents']) == 0:
                errors.append(f"{chain_name}: Empty agents list")

            # Validate agents
            for j, agent in enumerate(chain.get('agents', [])):
                agent_name = agent.get('name', f'agent_{j}')

                if 'role' not in agent:
                    errors.append(f"{chain_name}.{agent_name}: Missing 'role'")

        return errors
```

### Step 4: Add Validation to money_maker.py (4h)

**4.1 Create validation models**
```python
# core/finance/validators.py
from pydantic import BaseModel, Field, validator
from decimal import Decimal
from typing import Optional

class PricingInput(BaseModel):
    base_price: Decimal = Field(gt=0, description="Must be positive")
    discount_percentage: int = Field(ge=0, le=100)
    quantity: int = Field(gt=0)

    @validator('base_price')
    def validate_price_precision(cls, v):
        """Ensure price has max 2 decimal places"""
        if v.as_tuple().exponent < -2:
            raise ValueError("Price must have max 2 decimal places")
        return v

class RevenueCalculation(BaseModel):
    gross_revenue: Decimal
    net_revenue: Decimal
    tax_amount: Decimal
    fees: Decimal

    class Config:
        frozen = True  # Immutable for financial data
```

**4.2 Extract pricing config**
```yaml
# core/config/pricing.yaml
plans:
  free:
    price: 0
    features:
      - storage: 1GB
      - api_requests: 100/month

  pro:
    price: 49
    features:
      - storage: 10GB
      - api_requests: 1000/month

  enterprise:
    price: 299
    features:
      - storage: unlimited
      - api_requests: unlimited

discounts:
  annual:
    percentage: 20
    description: "20% off annual plans"

  volume:
    - min_quantity: 5
      percentage: 10
    - min_quantity: 10
      percentage: 15
```

**4.3 Refactor money_maker.py**
```python
# core/finance/money_maker.py (with validation)
from core.finance.validators import PricingInput, RevenueCalculation
from decimal import Decimal
import yaml

class MoneyMaker:
    """Revenue calculations with validation"""

    def __init__(self, pricing_config_path: str):
        with open(pricing_config_path) as f:
            self.pricing_config = yaml.safe_load(f)

    def calculate_revenue(self, input_data: PricingInput) -> RevenueCalculation:
        """Calculate revenue with validated inputs"""
        # Input already validated by Pydantic

        gross = input_data.base_price * input_data.quantity
        discount = gross * (Decimal(input_data.discount_percentage) / 100)
        net = gross - discount

        # Apply tax (simplified)
        tax = net * Decimal("0.10")

        # Platform fees
        fees = net * Decimal("0.029")  # Stripe fees

        return RevenueCalculation(
            gross_revenue=gross,
            net_revenue=net - tax - fees,
            tax_amount=tax,
            fees=fees
        )
```

---

## ✅ TODO

- [x] Split control_enhanced.py into 4 modules (12h) - COMPLETED 2026-01-19
- [x] Split knowledge_graph.py into 3 modules (8h) - COMPLETED 2026-01-19
- [x] Refactor agent_chains.py to config-driven (6h) - COMPLETED 2026-01-19
- [x] Add validation to money_maker.py (4h) - COMPLETED 2026-01-19
- [ ] Write unit tests for all modules (8h) - PENDING
- [ ] Integration testing (4h) - PENDING
- [ ] Update documentation (2h) - PENDING

**Total:** 44 hours (Week 3)
**Completed:** 30 hours | **Remaining:** 14 hours

---

## 📊 SUCCESS CRITERIA

- ✅ control_enhanced.py: 672 → 4 files × ~150 lines
- ✅ knowledge_graph.py: 429 → 3 files × ~130 lines
- ✅ agent_chains.py: 353 → 80 lines + YAML config
- ✅ money_maker.py: Input validation 100%
- ✅ Memory limit: Knowledge graph capped at 10K entities
- ✅ Config-driven: Chains, pricing externalized

---

## ⚠️ RISK ASSESSMENT

**High Risk:** Threading in control_enhanced.py
**Mitigation:** Comprehensive lock testing, stress testing

**Medium Risk:** Knowledge graph memory limits
**Mitigation:** LRU eviction, monitoring

---

## 🔒 SECURITY CONSIDERATIONS

- Financial validation: Pydantic models prevent injection
- Circuit breaker: Prevents cascading failures
- Memory limits: DoS prevention in knowledge graph

---

_Phase 8: Core business logic optimization for stability and security_
