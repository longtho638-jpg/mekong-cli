# Digital Therapeutics & Mental Health Tech

FDA-reimbursable DTx platform, AI coaching, CBT module delivery, wearable-integrated mental health monitoring.

## When to Use
- Building FDA-regulated digital therapy apps
- Adaptive CBT/DBT session delivery with AI personalization
- Wearable biosignal integration (HRV, sleep, activity)
- Insurance reimbursement claims automation
- Clinical outcome measurement and evidence generation

## Key Patterns
- **Standards**: FHIR R4, HL7, HIPAA compliance, FDA 21 CFR Part 11
- **Wearables**: Apple HealthKit, Google Health Connect, Fitbit API, Garmin Connect
- **Therapy**: CBT, DBT, ACT modules, guided meditation, exposure therapy
- **Outcomes**: PHQ-9, GAD-7, DASS-21 validated instruments

## Architecture
```
Patient App → Therapy Session Engine → Adaptive AI Personalizer
     ↓              ↓                        ↓
Wearable Sync   CBT Module Library    Outcome Tracker
     ↓                                      ↓
Biosignal Analytics        Reimbursement Claims → Insurance APIs
```

## SDK
`@agencyos/vibe-digital-therapeutics` — therapy session engine, wearable sync, outcome tracking hooks
