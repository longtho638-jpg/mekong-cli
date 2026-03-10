---
name: eldercare-aging-tech
description: "AgeTech, remote patient monitoring for seniors, fall detection, medication adherence, social isolation tools — activate when building senior care platforms, RPM devices, caregiver apps, or aging-in-place technology"
source: research-driven-2026
license: MIT
version: 1.0.0
---

# Eldercare & AgeTech — Skill

> The global AgeTech market hit $4.3B in 2025, driven by aging Baby Boomer demographics and post-COVID acceleration of remote patient monitoring adoption by Medicare Advantage plans covering RPM reimbursement.

## When to Activate
- Building remote patient monitoring (RPM) platforms for seniors
- Implementing fall detection using wearables, cameras, or radar sensors
- Designing medication adherence and dispensing reminder systems
- Creating social connection platforms to combat senior isolation
- Integrating with EHR systems for care coordination (HL7 FHIR)
- Building caregiver coordination apps with family access portals
- Developing cognitive assessment or early dementia screening tools

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Remote Monitoring | Vitals (BP, HR, SpO2, glucose) via Bluetooth/cellular devices | CarePredict, Validic, Welby Health |
| Fall Detection | Wearable accelerometers, computer vision, mmWave radar | Apple Watch Fall Detection API, Vayyar, Nobi |
| Medication Management | Smart dispenser integration, adherence tracking, refill alerts | Philips Medminder, Hero Health API |
| Social Engagement | Video calling simplified UI, activity programs, family sharing | GrandPad, Caribou, Apple FaceTime SDK |
| EHR Integration | FHIR R4 APIs for care team data sharing, CMS compliance | Epic FHIR, Cerner, AWS HealthLake |
| Emergency Response | SOS button, 24/7 monitoring center integration, 911 dispatch | Lively by Best Buy, Medical Guardian |

## Architecture Patterns
```
[Wearable / Home Sensor] (BLE/LTE)
      │ vitals + activity + anomaly events
      ▼
[IoT Gateway / Hub] — local edge processing
      │ MQTT over TLS
      ▼
[HIPAA-Compliant Cloud Backend]
      ├── Vitals ingestion → time-series DB (InfluxDB)
      ├── Anomaly Detection (ML: fall, gait change)
      ├── Alert Engine → caregiver push + SMS
      └── FHIR R4 API → EHR/Care Team
      │
      ▼
[Caregiver / Family App]     [Senior Tablet App (simplified UI)]
      │                              │
      ▼                              ▼
[Dashboard] — vitals trends, activity, medication log
```

```python
# FHIR R4 observation for blood pressure reading
import requests

observation = {
    "resourceType": "Observation",
    "status": "final",
    "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]}],
    "code": {"coding": [{"system": "http://loinc.org", "code": "85354-9", "display": "Blood pressure panel"}]},
    "subject": {"reference": "Patient/elder-12345"},
    "effectiveDateTime": "2026-03-01T08:30:00Z",
    "component": [
        {"code": {"coding": [{"code": "8480-6", "display": "Systolic"}]}, "valueQuantity": {"value": 128, "unit": "mmHg"}},
        {"code": {"coding": [{"code": "8462-4", "display": "Diastolic"}]}, "valueQuantity": {"value": 82, "unit": "mmHg"}},
    ],
}
requests.post(f"{FHIR_BASE}/Observation", json=observation, headers={"Authorization": f"Bearer {TOKEN}"})
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| CarePredict | AI-powered ADL monitoring, fall prediction | Per-resident/month SaaS |
| GrandPad | Senior-safe tablet with simplified UX + 4G | Hardware + $35/mo service |
| Best Buy Health (Lively) | PERS devices, urgent response, caregiver app | $25–$35/mo monitoring |
| Lively (GreatCall) | Mobile + wearable with urgent response center | Device + monthly plan |
| Papa | Companion care marketplace (human + digital) | PMPM with health plans |

## Related Skills
- `backend-development` — HIPAA-compliant API design, PHI encryption at rest/transit
- `databases` — Time-series vitals storage, FHIR resource persistence
- `ai-safety-alignment-governance` — Bias auditing for fall prediction models across demographics
