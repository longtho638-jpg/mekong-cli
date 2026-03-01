# FemTech — Women's Health & Reproductive Tech

Digital health platforms focused on menstrual health, fertility, pregnancy, menopause, and women-specific clinical workflows.

## When to Use
- Building period tracking, fertility, or pregnancy apps
- Telehealth platforms specializing in gynecology, reproductive endocrinology
- Menopause management, hormone therapy tracking
- Fertility clinic software: IVF cycle management, embryo grading
- Insurance + HSA/FSA billing for reproductive health services

## Key Concepts

| Term | Meaning |
|------|---------|
| BBT | Basal Body Temperature — fertility tracking signal |
| LH Surge | Luteinizing Hormone peak → ovulation prediction |
| OPK | Ovulation Predictor Kit API data ingestion |
| IVF Protocol | Stimulation → Retrieval → Transfer cycle |
| AMH | Anti-Müllerian Hormone — ovarian reserve marker |
| PCOS | Polycystic Ovary Syndrome — condition workflow |
| EDD | Estimated Due Date (pregnancy) |
| HRT | Hormone Replacement Therapy tracking |

## Core Modules

```
Cycle Tracker
  ├── Period Log + Symptom Journal
  ├── BBT Chart + LH/hCG Data Ingestion (Bluetooth OPK)
  ├── Fertility Window Prediction (ML)
  └── Cycle Irregularity Alerts → Telehealth Referral

Fertility Clinic EMR
  ├── IVF Protocol Manager (stim days, dosing, monitoring)
  ├── Embryo Grading + Cryopreservation Log
  ├── Partner Semen Analysis Tracker
  └── Insurance Prior Auth Automation

Pregnancy Companion
  ├── Week-by-Week Content + Milestone Tracker
  ├── Kick Counter + Contraction Timer
  ├── OB Appointment Scheduler
  └── HIPAA-compliant Partner Sharing

Menopause Platform
  ├── Symptom Diary (hot flashes, sleep, mood)
  ├── HRT Adherence Tracker
  ├── Bone Density + Cardiovascular Risk Score
  └── Telehealth Prescription Workflow
```

## Key Integrations

| Category | Services |
|----------|---------|
| Wearables | Oura Ring API, Apple HealthKit, Garmin Connect |
| OPK Devices | Kegg, Mira, Inito (Bluetooth BLE SDK) |
| Telehealth | Doxy.me, Zoom for Healthcare, Twilio Video |
| Lab Results | Labcorp, Quest, HL7 FHIR R4 |
| EHR | Epic MyChart, Athenahealth, Elation Health |
| Pharmacy | DoseSpot (eRx), Truepill |
| Payments | Stripe + FSA/HSA validation (Sika Health API) |

## HIPAA Compliance Checklist
- Encrypt PHI at rest (AES-256) and in transit (TLS 1.3)
- Audit logs for all PHI access (who, when, what)
- BAA required with every vendor handling PHI
- Minimum necessary data principle — no over-collection
- Consent flows: research opt-in, partner data sharing, data export/deletion

## Implementation Patterns

```typescript
interface CycleLog {
  userId: string;
  cycleStart: string;        // ISO date
  periodDays: number;
  cycleLengthDays: number;
  symptoms: SymptomEntry[];
  bbtReadings: { date: string; temp: number; unit: 'C' | 'F' }[];
  lhReadings: { date: string; value: number; surge: boolean }[];
}

interface FertilityWindow {
  peakDay: string;
  fertileStart: string;
  fertileEnd: string;
  confidence: 'high' | 'medium' | 'low';
  method: 'calendar' | 'bbt' | 'lh' | 'combined';
}

interface IVFCycle {
  patientId: string;
  protocol: 'antagonist' | 'agonist_long' | 'mini_ivf';
  stimStart: string;
  medications: { drug: string; dose: number; unit: string }[];
  monitoringDays: MonitoringVisit[];
  retrievalDate?: string;
  embryosGraded?: EmbryoRecord[];
  transferDate?: string;
}
```

## SDK
`@agencyos/vibe-femtech` — cycle tracker, fertility window engine, IVF protocol manager, HIPAA PHI utilities
