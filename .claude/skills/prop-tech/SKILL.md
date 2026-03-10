# PropTech — Property Management & Real Estate SaaS

Software for landlords, property managers, REITs, and tenant platforms.
Distinct from generic real-estate-agent skill (focused on search/listings) — this covers operations.

## When to Use
- Building property management platforms (rent collection, maintenance, leases)
- Tenant screening, digital lease signing, move-in/move-out workflows
- Short-term rental (STR) management: dynamic pricing, OTA sync
- REIT/fund reporting: NAV, distributions, investor portals
- Smart building integrations: IoT sensors, access control, energy monitoring

## Key Concepts

| Term | Meaning |
|------|---------|
| NOI | Net Operating Income = Revenue - Operating Expenses |
| Cap Rate | NOI / Property Value (valuation metric) |
| OTA Sync | Sync listings to Airbnb/VRBO/Booking.com |
| CAM | Common Area Maintenance charges |
| CoStar/ATTOM | Commercial property data APIs |
| Estoppel | Tenant certification of lease terms |
| Lease Abstraction | AI extraction of key lease terms from PDF |

## Core Modules

```
Tenant Portal
  ├── Online Rent Payment (ACH/card via Stripe/Plaid)
  ├── Maintenance Requests → Work Order Queue
  ├── Digital Lease Signing (DocuSign/HelloSign)
  └── Move-in/Move-out Checklists + Photo Evidence

Property Manager Dashboard
  ├── Portfolio Overview (occupancy, rent roll, NOI)
  ├── Lease Expiry Tracker + Renewal Automation
  ├── Vendor/Contractor Network + Payment
  └── Inspection Reports + Compliance Tracking

STR Operations
  ├── Dynamic Pricing (Beyond Pricing, PriceLabs APIs)
  ├── OTA Channel Manager (Guesty, Hostaway APIs)
  ├── Cleaning/Turnover Scheduler
  └── Revenue Analytics (RevPAR, ADR, Occupancy)
```

## Key Integrations

| Category | Services |
|----------|---------|
| Payments | Stripe, Plaid (ACH), PayNearMe (cash) |
| E-Sign | DocuSign, HelloSign, Dropbox Sign |
| Tenant Screening | TransUnion SmartMove, Experian RentBureau |
| Accounting | QuickBooks, Buildium, AppFolio |
| Dynamic Pricing | PriceLabs, Beyond Pricing, Wheelhouse |
| OTA | Guesty, Hostaway (wrap Airbnb/VRBO APIs) |
| IoT/Access | SmartThings, Yale, August, Brivo |
| Property Data | ATTOM, CoStar, Zillow API |

## Implementation Patterns

```typescript
// Rent Roll snapshot
interface RentRoll {
  propertyId: string;
  units: UnitLedger[];
  totalRent: number;
  occupancyRate: number; // 0–1
  snapshotDate: string;  // ISO
}

// Maintenance ticket
interface WorkOrder {
  id: string;
  tenantId: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'other';
  priority: 'emergency' | 'high' | 'normal' | 'low';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved';
  vendorId?: string;
  photos: string[]; // URLs
}

// Dynamic pricing signal
interface PricingSignal {
  date: string;
  baseRate: number;
  suggestedRate: number;
  factors: { name: string; delta: number }[];
}
```

## SDK
`@agencyos/vibe-prop-tech` — rent roll, work order, lease abstraction, STR pricing helpers
