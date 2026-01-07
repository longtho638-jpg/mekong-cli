# 📦 AntigravityKit Modules

> Complete module reference
> BE ↔ FE 100% sync

---

## Core Modules

### 🧬 AgencyDNA
**Purpose**: Your agency's unique identity

**File**: `antigravity/core/agency_dna.py`

**Features**:
- Vietnamese tones (Miền Tây, Miền Bắc, Miền Trung)
- Pricing tiers (Starter → Enterprise)
- Service management
- Tagline generation

**Usage**:
```python
from antigravity.core.agency_dna import AgencyDNA, Tone

dna = AgencyDNA(
    name="NovaAgency",
    niche="Nông sản",
    location="Cần Thơ",
    tone=Tone.MIEN_TAY
)
```

---

### 🧲 ClientMagnet
**Purpose**: Lead generation and conversion

**File**: `antigravity/core/client_magnet.py`

**Features**:
- Lead sources (Facebook, Zalo, Website, Referral)
- Lead scoring (0-100)
- Pipeline tracking
- Conversion metrics

**Usage**:
```python
from antigravity.core.client_magnet import ClientMagnet

magnet = ClientMagnet()
lead = magnet.add_lead("ABC Corp", source=LeadSource.FACEBOOK)
magnet.qualify_lead(lead, budget=5000, score=85)
```

---

### 💰 RevenueEngine
**Purpose**: Revenue tracking and forecasting

**File**: `antigravity/core/revenue_engine.py`

**Features**:
- Invoice management
- MRR/ARR calculation
- VND + USD support
- 3-month forecasting

**Usage**:
```python
from antigravity.core.revenue_engine import RevenueEngine

engine = RevenueEngine()
inv = engine.create_invoice("Client A", 1500)
print(f"MRR: ${engine.get_mrr()}")
```

---

### 🎨 ContentFactory
**Purpose**: Mass content production

**File**: `antigravity/core/content_factory.py`

**Features**:
- 30+ content ideas per run
- Multiple platforms (Facebook, TikTok, YouTube, Zalo)
- Virality scoring (0-100)
- Content calendar

**Usage**:
```python
from antigravity.core.content_factory import ContentFactory

factory = ContentFactory(niche="Nông sản")
ideas = factory.generate_ideas(30)
```

---

## Platform Modules

### 🏢 FranchiseManager
**Purpose**: Territory-based franchise network

**File**: `antigravity/franchise/manager.py`

**Features**:
- 8 territories in Vietnam
- Capacity limits
- 20% royalty system
- Performance reports

**Usage**:
```python
from antigravity.franchise.manager import FranchiseManager, Territory

manager = FranchiseManager()
f = manager.add_franchisee("Anh Minh", territory=Territory.CAN_THO)
manager.record_revenue(f, 10000)  # $2,000 royalty
```

---

### 📊 VCMetrics
**Purpose**: VC readiness assessment

**File**: `antigravity/vc/metrics.py`

**Features**:
- MRR, ARR, Growth tracking
- LTV/CAC ratio
- Rule of 40 score
- Readiness assessment (0-100)
- Gap analysis

**Usage**:
```python
from antigravity.vc.metrics import VCMetrics, FundingStage

metrics = VCMetrics(
    mrr=50000,
    growth_rate=15,
    cac=200,
    ltv=2400,
    stage=FundingStage.SEED
)
print(f"Score: {metrics.readiness_score()}/100")
```

---

### 🛡️ DataMoat
**Purpose**: Proprietary intelligence

**File**: `antigravity/platform/data_moat.py`

**Features**:
- Success pattern recording
- Best practices generation
- Benchmark tracking
- Moat strength scoring

**Usage**:
```python
from antigravity.platform.data_moat import DataMoat

moat = DataMoat()
moat.record_success("Nông sản", "facebook", 95)
practices = moat.get_best_practices("Nông sản")
```

---

## Module Mapping (BE ↔ FE)

| Backend | Frontend | UI Component |
|---------|----------|--------------|
| AgencyDNA | Agency Settings | AgencyProfile.tsx |
| ClientMagnet | CRM Dashboard | LeadPipeline.tsx |
| RevenueEngine | Revenue Dashboard | RevenueCards.tsx |
| ContentFactory | Content Calendar | ContentGenerator.tsx |
| FranchiseManager | Franchise Network | TerritoryMap.tsx |
| VCMetrics | VC Dashboard | MetricsGauge.tsx |
| DataMoat | Insights Panel | BestPractices.tsx |

---

## Architecture

```
antigravity/
├── core/                 # Core business logic
│   ├── agency_dna.py
│   ├── client_magnet.py
│   ├── revenue_engine.py
│   └── content_factory.py
├── platform/             # Platform features
│   └── data_moat.py
├── franchise/            # Franchise system
│   └── manager.py
├── vc/                   # VC tools
│   └── metrics.py
├── cli/                  # CLI commands
│   └── __init__.py
└── locales/              # Translations
    └── vi.py
```

---

🏯 **100% BE ↔ FE Sync Complete**
