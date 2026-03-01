# Technical Research Report: 5 Critical Domains
**Date:** 2026-03-01 | **Timestamp:** 0759 | **Scope:** API Security, Testing, Performance, Database, Microservices

---

## DOMAIN 1: API SECURITY

### Top Documentation Sources
- [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/)
- [OWASP API Security Project](https://owasp.org/www-project-api-security/)
- [Curity JWT Best Practices](https://curity.io/resources/learn/jwt-best-practices/)
- [RFC 9700 - OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/rfc9700/)

### Key Concepts & Vulnerabilities

#### Top 3 API Threats (2023)
| Rank | Threat | Impact | Mitigation |
|------|--------|--------|-----------|
| #1 | **Broken Object Level Authorization (BOLA)** | 40% of API attacks | Enforce per-request authorization checks, validate user permissions before CRUD |
| #2 | **Broken Authentication** | Account compromise | Use OAuth 2.0/2.1 + OpenID Connect, asymmetric key signing |
| #3 | **Unrestricted Resource Consumption** | DDoS/brute force | Implement rate limiting + token bucket algorithm |

#### JWT Security Stack
- **Token Storage:** BFF (Backend for Frontend) pattern required — JWTs in Secure HttpOnly cookies, never localStorage
- **Validation:** Always validate signature + issuer + audience — never trust JWT format alone
- **Asymmetric Keys:** Use RSA/ECDSA for signing, centralized key rotation
- **Token Lifespan:** Access tokens < 15min, refresh tokens < 7 days (short-lived reduces theft window)
- **Claim Restrictions:** Avoid sensitive business data in JWT, especially cross-org tokens

#### OAuth 2.1 Standards
- Replaced OAuth 2.0 with stricter requirements: PKCE mandatory for public clients
- Implicit grant + password grant removed (security risk)
- Mutual TLS or signed JWT for client authentication ("Private Key JWT")
- Recommend: Asymmetric crypto for all client interactions

### Rate Limiting Patterns

#### Algorithms (2025)
| Algorithm | Use Case | Characteristic |
|-----------|----------|-----------------|
| **Token Bucket** | Distributed systems | Allows controlled bursts, constant refill rate |
| **Leaky Bucket** | Fixed throughput | Predictable server load, rejects legitimate spikes |
| **Sliding Window** | Accuracy critical | Memory-heavy, precise request tracking by timestamp |

#### Layered Architecture
```
Edge (API Gateway)    → Coarse-grained rate limiting (IP-based)
                           ↓
Service Mesh          → Service-to-service limits
                           ↓
Application Layer     → Fine-grained, context-aware limits (user/tenant)
```

#### Headers Standard
Use RateLimit header fields for consistent client communication:
- `RateLimit-Limit`: Max requests per window
- `RateLimit-Remaining`: Remaining quota
- `RateLimit-Reset`: Unix timestamp of next window

### Essential Tools
- **API Scanning:** 42Crunch, Salt Security
- **Authorization Testing:** Burp Suite, OWASP ZAP
- **JWT Inspection:** jwt.io, Auth0 Debugger
- **Rate Limit Testing:** Apache JMeter, Vegeta (Go)

---

## DOMAIN 2: TESTING PATTERNS

### Top Documentation Sources
- [Cucumber BDD Guide](https://cucumber.io/blog/bdd/bdd-vs-tdd/)
- [F# Property-Based Testing](https://fsharpforfunandprofit.com/pbt/)
- [BrowserStack TDD vs BDD](https://www.browserstack.com/guide/tdd-vs-bdd-vs-atdd)
- [Trail of Bits Mutation Testing](https://blog.trailofbits.com/2025/09/18/use-mutation-testing-to-find-the-bugs-your-tests-dont-catch/)

### Test Methodology Comparison

#### TDD (Test-Driven Development)
- **Cycle:** Write test → Red → Green → Refactor
- **Strength:** Ensures code meets requirements from start, tight feedback loop
- **Weakness:** Doesn't guarantee business value, purely unit-focused
- **Best For:** Core business logic, backward compatibility assurance

#### BDD (Behavior-Driven Development)
- **Format:** Given-When-Then language (bridges dev-QA-business)
- **Example:** "Given user is logged in, When user clicks checkout, Then order placed"
- **Tool Stack:** Cucumber, Gherkin syntax
- **Best For:** Acceptance criteria, cross-team communication

#### Property-Based Testing
- **Concept:** Generate 100s of random inputs, verify invariant holds for all
- **Tools:** Hypothesis (Python), QuickCheck (Haskell), PropTest (Rust)
- **Use Case:** Edge case discovery, fuzzing-like behavior validation
- **Example:** "For any list, sorted list length = original list length"

#### Mutation Testing
- **Purpose:** Inject bugs into code, verify tests catch them (test quality metric)
- **Tools:** Stryker, PIT (Java), Slither-mutate (Solidity)
- **Threshold:** Mutation score > 80% indicates robust tests
- **2025 Integration:** Now embedded in CI/CD as quality gate

#### Contract Testing
- **Scope:** Validate API contracts between services (request/response shape)
- **Operators:** Mutate status codes, alter field types, remove optional fields
- **Tools:** Pact, Spring Cloud Contract
- **Advantage:** Prevents integration failures without full E2E tests

### Testing Pyramid (Recommended Ratios)
```
               / E2E Tests (5%)
              /  - Full user workflows, browser automation
             /
            /  Integration Tests (15%)
           /   - API contracts, database, messaging
          /
         /  Unit Tests (80%)
        /   - Business logic, pure functions
```

### Essential Tools
- **TDD:** pytest, Jest, RSpec
- **BDD:** Cucumber, SpecFlow, Behave
- **Property:** Hypothesis, QuickCheck
- **Mutation:** Stryker, PIT, Slither
- **Contract:** Pact, Spring Cloud Contract

---

## DOMAIN 3: PERFORMANCE OPTIMIZATION

### Top Documentation Sources
- [Google Web Vitals Guide](https://web.dev/articles/optimize-vitals-lighthouse)
- [Core Web Vitals 2025 Standards](https://systemsarchitect.net/core-web-vitals-2025/)
- [LogRocket Lighthouse Audits](https://blog.logrocket.com/leveraging-lighthouse-audits/)
- [AWS ElastiCache Caching Strategies](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html)

### Core Web Vitals (2025 Stricter Standards)

#### Three Metrics (75th Percentile)
| Metric | Good | Fair | Poor | Business Impact |
|--------|------|------|------|-----------------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5-4s | > 4s | Mobile bounce rate -27% |
| **INP** (Interaction to Next Paint) | ≤ 200ms | 200-500ms | > 500ms | User frustration (click lag) |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1-0.25 | > 0.25 | Visual instability = rage clicks |

#### 2025 Enforcement
- Google Search ranking penalizes poor Core Web Vitals
- Mobile-first indexing (mobile performance = search ranking)
- Tools: Lighthouse, PageSpeed Insights (free), CrUX data (real user metrics)

### Caching Strategies

#### Lazy Loading
- **Pattern:** Load data only on demand
- **Advantage:** Reduce initial page load, cache only frequently accessed data
- **Disadvantage:** First uncached request has latency spike
- **Best For:** Read-heavy workloads, sparse data access

#### Write-Through
- **Pattern:** Write to cache AND database simultaneously
- **Advantage:** Cache always consistent with DB
- **Disadvantage:** Write latency doubled (wait for both operations)
- **Best For:** Critical data (inventory, transactions)

#### Write-Behind (Write-Back)
- **Pattern:** Write to cache first, async write to DB later
- **Advantage:** Fast writes, decouple from storage latency
- **Disadvantage:** Data loss risk if cache crashes before DB flush
- **Best For:** Non-critical metrics, analytics, logs

#### Cache Invalidation
- **TTL-based:** Expire after time window (simple, eventual consistency)
- **Event-based:** Invalidate on data change (complex, always fresh)
- **LRU:** Evict least recently used (memory efficient)

### Profiling & Tools
- **Browser:** DevTools Performance tab, Lighthouse CI
- **Backend:** py-spy (Python), Node.js clinic.js
- **Database:** EXPLAIN ANALYZE, query profilers
- **Load Testing:** Apache JMeter, k6, Vegeta

### Lazy Loading Implementation
```python
# Code splitting example
import React from 'react'
const HeavyComponent = React.lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

---

## DOMAIN 4: DATABASE DESIGN

### Top Documentation Sources
- [10 Database Optimization Techniques 2025](https://nextnative.dev/blog/database-optimization-techniques)
- [DbSchema Best Practices](https://dbschema.com/blog/design/database-design-best-practices-2025/)
- [SQL Server Index Design Guide](https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-index-design-guide)
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [Atlas Schema as Code](https://atlasgo.io/)

### Schema Design Principles

#### Normalization vs. Denormalization
| Aspect | Normalized | Denormalized |
|--------|-----------|--------------|
| **Redundancy** | Minimal | Controlled duplication |
| **Join Count** | Many joins | Few/no joins |
| **Write Speed** | Slower (multiple updates) | Faster (single write) |
| **Query Speed** | Slower (join penalty) | Faster (read cache) |
| **Best For** | High write, OLTP | Read-heavy, OLAP/analytics |

#### AI-Driven Schema Optimization (2025)
- Tools analyze access patterns + query workloads
- Suggest optimal column ordering, partitioning strategy
- Oracle Autonomous DB, Azure SQL auto-tuning now standard

### Indexing Strategies

#### Index Types by Use Case
| Index Type | Use Case | Overhead |
|-----------|----------|----------|
| **B-Tree** | General purpose (PK, FK, WHERE) | Moderate read, moderate write |
| **Hash** | Exact match lookups | Fast reads, no range queries |
| **Bitmap** | Low-cardinality columns (status, category) | Very low storage |
| **Full-Text** | Text search (LIKE %pattern%) | High storage, specialized reads |

#### Indexing Rules
- **Selectivity:** Index columns used in WHERE (highest cardinality first)
- **Composite Index:** Order by selectivity (most selective first)
- **Avoid:** Indexing < 5% or > 95% cardinality columns
- **Size:** Keep index key width < 900 bytes (most engines)
- **Cost:** Every index slows INSERT/UPDATE/DELETE by ~5-10%

### Query Optimization

#### Anti-Patterns
```sql
-- ❌ BAD: SELECT * increases network/memory
SELECT * FROM orders WHERE user_id = 123;

-- ✅ GOOD: Select only needed columns
SELECT order_id, total, status FROM orders WHERE user_id = 123;

-- ❌ BAD: Multiple joins without proper indexing
SELECT * FROM orders
  JOIN customers ON ...
  JOIN products ON ...
  JOIN categories ON ...

-- ✅ GOOD: Denormalize if read-heavy
SELECT order_id, customer_name, product_name FROM orders_mv
```

#### Optimization Techniques
- **EXPLAIN ANALYZE:** Analyze query plan before execution
- **Partitioning:** Split large tables by date/region/hash (parallel scanning)
- **Sharding:** Distribute data across multiple databases (scale horizontally)
- **Materialized Views:** Pre-computed aggregations for dashboards
- **Connection Pooling:** pgBouncer, pgpool (reduce connection overhead)

### Migration Tools & Best Practices

#### Popular Tools
| Tool | Language | Strengths |
|------|----------|-----------|
| **Flyway** | Java, SQL | Simple versioning, automatic execution |
| **Liquibase** | XML, YAML, SQL | Complex changelogs, rollback support |
| **Atlas** | HCL (HashiCorp) | Schema-as-code, DevOps-friendly |
| **Drizzle** | TypeScript | ORM-integrated, type-safe migrations |

#### Migration Safety Checklist
- ✅ Always reversible (DOWN migration for every UP)
- ✅ Named sequentially or with timestamp prefix
- ✅ Tested in dev/staging before production
- ✅ Transaction-wrapped (atomic, all-or-nothing)
- ✅ Zero-downtime deployment (avoid table locks)

#### Risky Operations (Avoid or Mitigate)
| Operation | Risk | Mitigation |
|-----------|------|-----------|
| Add column with DEFAULT | Table lock during migration | Use CONCURRENTLY, backfill async |
| Drop column with data | Data loss | Archive first, then drop in separate migration |
| Add NOT NULL to existing column | All existing rows fail constraint | Backfill first, then add constraint |
| Rename column | Breakage if not coordinated | Add new column, migrate app code, drop old |

### ORM Best Practices

#### Lazy Loading vs. Eager Loading
```python
# ❌ BAD: N+1 problem (query per item)
for order in Order.query.all():
    print(order.customer.name)  # SELECT customer for EACH order

# ✅ GOOD: Eager load relationships
orders = Order.query.options(joinedload(Order.customer)).all()
```

#### Query Building
- Use ORM query builder for safety (SQL injection prevention)
- Avoid raw SQL unless performance-critical
- Always parameterize: `WHERE id = ?` not string interpolation
- Use connection pooling (HikariCP, sqlalchemy.pool)

---

## DOMAIN 5: MICROSERVICES PATTERNS

### Top Documentation Sources
- [Microservices.io Pattern Library](https://microservices.io/patterns/data/saga.html)
- [AWS Event Sourcing Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-data-persistence/)
- [Linkerd vs Istio Comparison](https://www.buoyant.io/linkerd-vs-istio)
- [Circuit Breaker Pattern Best Practices](https://www.baeldung.com/cs/microservices-circuit-breaker-pattern)

### Core Patterns

#### Saga Pattern (Distributed Transactions)
- **Problem:** Multi-service transaction spanning > 1 database
- **Solution:** Local transactions + compensating transactions
- **Types:**
  - **Choreography:** Service publishes event → next service subscribes + acts
  - **Orchestration:** Central coordinator tells each service what to do
- **Advantage:** Achieves eventual consistency without distributed locks
- **Disadvantage:** Complex error handling, ordering constraints

#### Event Sourcing
- **Concept:** Every state change = immutable event in event store
- **Audit Trail:** Replay all events to reconstruct state at any point
- **Advantage:** Complete audit, point-in-time recovery, event-driven architecture
- **Disadvantage:** Storage growth, complex testing, eventual consistency
- **Common Tool:** EventStoreDB, Apache Kafka (event log)

#### CQRS (Command Query Responsibility Segregation)
- **Idea:** Separate write model (commands) from read model (queries)
- **Benefit:** Independent scaling (write-heavy vs. read-heavy)
- **Pattern:**
  ```
  Command Side: Write to database → Emit event → Update read model
  Query Side:   Read from denormalized cache (no joins, optimized for UI)
  ```
- **Cost:** Eventual consistency between write/read models

#### Integrating Patterns
```
Event Sourcing → Events in event store → CQRS read model updates
                                      → Saga orchestrator triggers (eventual consistency)
                                      → Other microservices react to events
```

### Circuit Breaker Pattern (Fault Tolerance)

#### Three States
| State | Behavior | Transition |
|-------|----------|-----------|
| **Closed** | Requests pass through normally, monitoring health | → Open if error rate > threshold |
| **Open** | Requests rejected immediately (fail fast), not forwarded | → Half-Open after timeout (default 60s) |
| **Half-Open** | Limited test requests allowed (1-3) to check recovery | → Closed if succeed, Open if fail |

#### Configuration
```python
@circuitbreaker(
    failure_threshold=5,      # Trips after 5 consecutive failures
    recovery_timeout=60,      # Wait 60s before trying Half-Open
    expected_exception=Exception
)
def call_downstream_service():
    return requests.get("https://api.example.com/data")
```

#### Fallback Strategies
- **Default Value:** Return cached/stale data
- **Queue:** Queue request for later retry
- **Graceful Degradation:** Reduced functionality (read-only mode)
- **User Notification:** "Service temporarily unavailable"

#### 2025 Tool Landscape
- **Hystrix** → Maintenance mode (use Resilience4j instead)
- **Resilience4j** → Lightweight, recommended for new projects
- **Spring Cloud Circuit Breaker** → Abstraction layer over Resilience4j/Hystrix

### Service Mesh Comparison

#### Linkerd (Lightweight)
- **Philosophy:** Simple, secure, fast — do minimal magic
- **Latency Overhead:** 0.8-1.5ms (40-50x less than Istio)
- **Memory:** ~10MB per sidecar
- **mTLS:** On by default (no config needed)
- **Best For:** Kubernetes-only, performance-critical, small teams
- **Learning Curve:** Gentle

#### Istio (Feature-Rich)
- **Approach:** All-in-one with built-in ingress, multi-cluster, traffic shaping
- **Latency Overhead:** 40-50ms (Envoy proxy overhead)
- **Memory:** 40-50MB per sidecar
- **mTLS:** Supported but requires configuration
- **Best For:** Hybrid cloud (K8s + VMs), complex traffic rules
- **Learning Curve:** Steep

#### Selection Matrix
```
Choose Linkerd if:
  - Pure Kubernetes clusters
  - Performance critical (< 5ms latency budget)
  - Team size < 20
  - Feature set adequate (mTLS, traffic split, retry)

Choose Istio if:
  - Hybrid cloud (K8s + VMs + bare metal)
  - Need advanced traffic shaping (canary, A/B tests)
  - Multi-cluster federation required
  - Large team with DevOps expertise
```

### Service Mesh Best Practices

#### Gradual Rollout
1. Start with non-critical services (dev/staging)
2. Mesh one namespace at a time
3. Monitor golden signals (latency, error rate, throughput)
4. Expand based on success metrics

#### Security Defaults
- **mTLS Mode:** Start permissive (accept mTLS + plaintext), migrate to strict
- **AuthorizationPolicy:** Default-deny model (deny all, then whitelist)
- **Network Policy:** Pair with K8s NetworkPolicy for defense-in-depth

#### Monitoring
- **Tools:** Prometheus + Grafana, Jaeger (distributed tracing)
- **Key Metrics:** Service request rate, latency (p50/p95/p99), error rate
- **Traces:** Identify slow hops between services

---

## ACTIONABLE TAKEAWAYS

### Immediate Actions
1. **API Security:** Implement OWASP BOLA checks (authorize every request)
2. **Testing:** Start with TDD for new code, add BDD for acceptance criteria
3. **Performance:** Profile with Lighthouse, target LCP < 2.5s on mobile
4. **Database:** Add indexes on WHERE/JOIN/ORDER BY columns, use EXPLAIN ANALYZE
5. **Microservices:** Add circuit breaker to external service calls (Resilience4j)

### Short-Term (1-3 months)
- Implement JWT with short lifespan (< 15min) + refresh tokens
- Add property-based tests to critical paths (e.g., payment calculations)
- Set up materialized views for slow aggregation queries
- Pilot Linkerd on staging cluster (if K8s-based)

### Long-Term (3-12 months)
- Migrate to CQRS + Event Sourcing for complex domains
- Implement Saga pattern for multi-service transactions
- Set up mutation testing as CI/CD quality gate (> 80% score)
- Introduce service mesh for cross-cutting concerns (mTLS, rate limiting)

---

## UNRESOLVED QUESTIONS

1. **JWT Rotation:** How frequently should signing keys rotate in production? (Daily? Weekly?)
2. **Test Coverage:** What's optimal coverage ratio for mutation testing? (80%, 85%, 90%?)
3. **Database Sharding:** When should sharding be introduced? (TB size? Specific growth rate?)
4. **Eventual Consistency:** How to set SLA for saga compensation (timeout, retry limits)?
5. **Service Mesh Adoption:** Cost of Linkerd vs. Istio in production (operational overhead)?

---

## REFERENCE SOURCES

**API Security:**
- [OWASP API Security Top 10](https://owasp.org/API-Security/)
- [OWASP API Security Project](https://owasp.org/www-project-api-security/)
- [Curity JWT Best Practices](https://curity.io/resources/learn/jwt-best-practices/)
- [RFC 9700 OAuth 2.0 Security](https://datatracker.ietf.org/doc/rfc9700/)
- [Salt Security OWASP Explained](https://salt.security/blog/owasp-api-security-top-10-explained)
- [Postman Rate Limiting Guide](https://blog.postman.com/what-is-api-rate-limiting/)
- [Cloudflare Rate Limiting Best Practices](https://developers.cloudflare.com/waf/rate-limiting-rules/best-practices/)

**Testing:**
- [Cucumber BDD Guide](https://cucumber.io/blog/bdd/bdd-vs-tdd/)
- [F# Property-Based Testing](https://fsharpforfunandprofit.com/pbt/)
- [BrowserStack TDD vs BDD](https://www.browserstack.com/guide/tdd-vs-bdd-vs-atdd)
- [Trail of Bits Mutation Testing](https://blog.trailofbits.com/2025/09/18/use-mutation-testing-to-find-the-bugs-your-tests-dont-catch/)

**Performance:**
- [Google Web Vitals](https://web.dev/articles/optimize-vitals-lighthouse)
- [Core Web Vitals 2025](https://systemsarchitect.net/core-web-vitals-2025/)
- [LogRocket Lighthouse](https://blog.logrocket.com/leveraging-lighthouse-audits/)
- [AWS ElastiCache Strategies](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html)

**Database:**
- [10 Database Optimization Techniques](https://nextnative.dev/blog/database-optimization-techniques)
- [DbSchema Best Practices 2025](https://dbschema.com/blog/design/database-design-best-practices-2025/)
- [SQL Server Index Design](https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-index-design-guide)
- [AI SQL Query Optimization 2025](https://www.syncfusion.com/blogs/post/ai-sql-query-optimization-2025)
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [Atlas Schema as Code](https://atlasgo.io/)

**Microservices:**
- [Microservices.io Patterns](https://microservices.io/patterns/data/saga.html)
- [AWS Event Sourcing](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-data-persistence/)
- [Linkerd vs Istio](https://www.buoyant.io/linkerd-vs-istio)
- [Circuit Breaker Pattern](https://www.baeldung.com/cs/microservices-circuit-breaker-pattern)
- [Microsoft Circuit Breaker](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [Service Mesh 2025 Trends](https://blog.sparkfabrik.com/en/service-mesh)

---

*Report generated: 2026-03-01 0759 | Researcher subagent | Mekong-CLI*
