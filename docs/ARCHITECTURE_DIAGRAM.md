# 🗺️ AgencyOS Architecture Diagram

> Visual representation of the AgencyOS + Mekong HQ unified system

---

## 1. High-Level Architecture

```mermaid
graph TB
    subgraph "🌐 Client Layer"
        WEB[Web Browser]
        MOBILE[Mobile Apps]
    end
    
    subgraph "🏯 AgencyOS Frontend"
        NEXTJS[Next.js 14.2.35]
        MD3[Material Design 3]
        I18N["5 Languages"]
    end
    
    subgraph "🔌 API Layer"
        API[API Routes]
        MIDDLEWARE[Rate Limit + Security]
    end
    
    subgraph "💾 Data Layer"
        SUPABASE[(Supabase PostgreSQL)]
        RLS[Row Level Security]
    end
    
    subgraph "💳 Payment Gateways"
        STRIPE[Stripe Global]
        PAYOS[PayOS 🇻🇳]
        OMISE[Omise 🇹🇭]
        XENDIT[Xendit 🇮🇩🇵🇭]
    end
    
    subgraph "🤖 AI Layer"
        AGENTS[18 AI Agents]
        HYBRID[Hybrid Router]
        GEMINI[Google Gemini]
        OPENROUTER[OpenRouter]
    end
    
    WEB --> NEXTJS
    MOBILE --> NEXTJS
    NEXTJS --> API
    API --> MIDDLEWARE
    MIDDLEWARE --> SUPABASE
    SUPABASE --> RLS
    API --> STRIPE
    API --> PAYOS
    API --> OMISE
    API --> XENDIT
    API --> HYBRID
    HYBRID --> GEMINI
    HYBRID --> OPENROUTER
    AGENTS --> HYBRID
```

---

## 2. Module Architecture

```mermaid
graph LR
    subgraph "lib/"
        subgraph "billing/"
            B1[stripe.ts]
            B2[subscription.ts]
            B3[currency.ts]
            B4[gateways.ts]
        end
        
        subgraph "tenant/"
            T1[isolation.ts]
            T2[white-label.ts]
        end
        
        subgraph "analytics/"
            A1[usage.ts]
            A2[cohort.ts]
            A3[metrics.ts]
        end
        
        subgraph "security/"
            S1[rate-limit.ts]
            S2[sanitize.ts]
            S3[headers.ts]
            S4[compliance.ts]
        end
        
        subgraph "i18n/"
            I1[locale-utils.ts]
        end
    end
```

---

## 3. Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant D as Database
    participant P as Payment

    U->>F: Access AgencyOS
    F->>A: Request /api/billing/metrics
    A->>D: Query with RLS
    D-->>A: Tenant-isolated data
    A-->>F: MRR, Analytics
    F-->>U: Dashboard rendered
    
    U->>F: Upgrade to Pro
    F->>A: POST /api/checkout
    A->>P: Create session (PayOS/Stripe)
    P-->>U: Redirect to payment
    U->>P: Complete payment
    P->>A: Webhook callback
    A->>D: Update subscription
```

---

## 4. Multi-Tenancy Model

```mermaid
erDiagram
    TENANTS ||--o{ MEMBERS : has
    TENANTS ||--o{ SUBSCRIPTIONS : has
    TENANTS ||--o{ PROJECTS : owns
    TENANTS ||--o{ USAGE_EVENTS : tracks
    
    TENANTS {
        uuid id PK
        string name
        string slug UK
        enum plan
        jsonb settings
    }
    
    MEMBERS {
        uuid id PK
        uuid tenant_id FK
        uuid user_id
        enum role
        enum status
    }
    
    SUBSCRIPTIONS {
        uuid id PK
        uuid tenant_id FK
        string stripe_id
        enum status
        timestamp period_end
    }
```

---

## 5. AI Agent Hub

```mermaid
graph TB
    subgraph "Agent Hub (161 Agents)"
        subgraph "Content Agents"
            C1[Blog Writer]
            C2[Social Media]
            C3[Email Copy]
        end
        
        subgraph "Marketing Agents"
            M1[SEO Optimizer]
            M2[PPC Manager]
            M3[Analytics]
        end
        
        subgraph "Operations Agents"
            O1[Scheduler]
            O2[Reporter]
            O3[Automator]
        end
    end
    
    HYBRID[Hybrid Router] --> C1
    HYBRID --> C2
    HYBRID --> C3
    HYBRID --> M1
    HYBRID --> M2
    HYBRID --> M3
    HYBRID --> O1
    HYBRID --> O2
    HYBRID --> O3
```

---

## 6. Deployment Architecture

```mermaid
graph TB
    subgraph "GitHub"
        REPO[mekong-cli repo]
    end
    
    subgraph "Vercel"
        EDGE[Edge Functions]
        SSR[SSR Rendering]
        CDN[Global CDN]
    end
    
    subgraph "Supabase Cloud"
        DB[(PostgreSQL)]
        AUTH[Auth Service]
        STORAGE[File Storage]
        REALTIME[Realtime]
    end
    
    REPO -->|Push| EDGE
    EDGE --> SSR
    SSR --> CDN
    EDGE -->|API| DB
    EDGE -->|SSO| AUTH
    EDGE -->|Files| STORAGE
    DB -->|Subscribe| REALTIME
```

---

## 7. Security Layers

```mermaid
graph LR
    subgraph "Security Stack"
        L1[Rate Limiting]
        L2[Input Sanitization]
        L3[CSP Headers]
        L4[HSTS]
        L5[RLS Policies]
        L6[PDPA/GDPR]
    end
    
    REQUEST --> L1
    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
    L5 --> L6
    L6 --> RESPONSE
```

---

## Quick Stats

| Layer | Technology | Count |
|-------|------------|-------|
| Frontend | Next.js + MD3 | 95+ routes |
| API | Route handlers | 15+ endpoints |
| Database | PostgreSQL | 16+ tables |
| AI | Multi-provider | 161 agents |
| Payments | 4 gateways | 7 currencies |
| Languages | next-intl | 5 locales |

---

*Diagram created for AgencyOS v2.0 documentation*
