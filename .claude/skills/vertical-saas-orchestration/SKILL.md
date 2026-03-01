# Vertical SaaS Orchestration — Multi-Vertical Platform Patterns

Orchestration patterns for running multiple industry-specific SaaS verticals on a shared platform with tenant isolation, vertical-specific features, and cross-vertical data intelligence.

## When to Use
- Building a platform that serves 2+ distinct industry verticals from one codebase
- Implementing tenant isolation strategies at schema, row, or application level
- Sharing platform services (auth, billing, notifications) across verticals while keeping domain logic separate
- Extracting cross-vertical insights (benchmarking, cross-sell signals, aggregated analytics)

## Key Concepts
- **Vertical Isolation**: Each vertical owns its domain models, workflow configs, and compliance rules — shared infra underneath
- **Tenant Routing**: Subdomain or path-based routing (`legal.platform.com` vs `healthcare.platform.com`) maps to vertical context
- **Feature Flagging per Vertical**: `vertical_features` table drives UI/API capabilities — no vertical-specific deploys
- **Cross-Vertical Data Layer**: Anonymized, normalized events from all verticals feed a shared analytics warehouse for benchmarking
- **Shared Services**: Auth (SSO/SAML per org), Billing (metered by vertical metric), Notifications, File storage, Audit log
- **Vertical SDK Pattern**: Each vertical exposes a typed SDK interface (`VerticalAdapter`) — platform calls adapters, not vertical internals

## Implementation Patterns

```typescript
// Vertical adapter interface — each vertical implements this contract
interface VerticalAdapter {
  readonly verticalId: string;                          // "legal" | "healthcare" | "construction"
  getEntitySchema(): EntitySchema;                      // domain-specific data model
  getWorkflowDefinitions(): WorkflowDef[];              // configurable process steps
  getComplianceRules(): ComplianceRule[];               // HIPAA / SOX / OSHA etc.
  getKPIs(tenantId: string): Promise<KPISnapshot>;      // vertical-specific metrics
  onTenantProvisioned(tenantId: string): Promise<void>; // seed vertical defaults
}

// Platform orchestrator resolves vertical at request time
function resolveVertical(req: Request): VerticalAdapter {
  const verticalId = req.headers["x-vertical-id"] ?? tenantRegistry.get(req.tenantId).verticalId;
  return verticalRegistry[verticalId];
}
```

```sql
-- Row-level tenant isolation with vertical context
CREATE TABLE entities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  vertical_id TEXT NOT NULL,         -- "legal", "healthcare", etc.
  type        TEXT NOT NULL,         -- vertical-specific entity type
  data        JSONB NOT NULL,        -- flexible vertical schema
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_entities_tenant ON entities(tenant_id, vertical_id, type);

-- RLS: tenants only see their own data
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON entities
  USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

```python
# Cross-vertical benchmarking pipeline
def compute_vertical_benchmark(vertical_id: str, kpi: str) -> dict:
    """Aggregate anonymized KPI across all tenants in a vertical."""
    rows = db.query("""
        SELECT percentile_cont(0.25) WITHIN GROUP (ORDER BY value) AS p25,
               percentile_cont(0.50) WITHIN GROUP (ORDER BY value) AS p50,
               percentile_cont(0.75) WITHIN GROUP (ORDER BY value) AS p75
        FROM tenant_kpi_snapshots
        WHERE vertical_id = %s AND kpi_name = %s
          AND snapshot_date >= now() - INTERVAL '90 days'
    """, [vertical_id, kpi])
    return {"p25": rows[0].p25, "median": rows[0].p50, "p75": rows[0].p75}
```

## References
- Temporal Multi-Tenancy Patterns: https://docs.temporal.io/cloud/multi-region
- Postgres RLS Guide: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Stripe Multi-Account Architecture: https://stripe.com/docs/connect/separate-charges-and-transfers
