---
name: pet-tech-veterinary
description: "Pet health platforms, veterinary telemedicine, pet insurance, GPS tracking, smart feeders — activate when building pet care applications, vet practice management software, or pet IoT device integrations"
source: research-driven-2026
license: MIT
version: 1.0.0
---

# Pet Tech & Veterinary — Skill

> The global pet tech market exceeded $8B in 2025; telehealth adoption by veterinary chains (Banfield, VCA) and direct-to-consumer pet insurance APIs enabled new software-first pet health platforms.

## When to Activate
- Building a veterinary telemedicine or triage platform
- Integrating pet insurance claims processing (Trupanion, Nationwide)
- Implementing GPS tracking and activity monitoring for pets
- Designing smart feeder or automatic litter box device backends
- Creating pet health records and vaccine reminder systems
- Building a pet care marketplace (groomers, walkers, sitters)
- Developing vet practice management software (PIMS)

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Telehealth | Async (photo/video) and live video vet consultations | Vetster, Anipanion, Twilio Video |
| Health Records | Digital vaccination records, prescription history, SOAP notes | Petvisor, Cornerstone PIMS API |
| GPS & Activity | Real-time pet location, daily activity scoring, sleep tracking | Whistle API, Fi Collar, Tractive API |
| Insurance Claims | FNOL submission, reimbursement status, EOB parsing | Trupanion API, Lemonade Pet API |
| Smart Devices | IoT smart feeder schedules, auto litter box events, camera feeds | PetSafe, Petlibro, Litter-Robot API |
| Marketplace | Booking engine for groomers/walkers/sitters, review system | PetDesk, Time To Pet, Gingr |

## Architecture Patterns
```
[Pet Owner App]
      ├── Health Records → FHIR-lite pet profile
      ├── Telehealth → schedule async/live consult
      ├── GPS Tracking ← Whistle/Fi webhook (location ping every 30s)
      └── Insurance → submit claim photos + invoice
      │
      ▼
[Backend Platform]
      ├── Vet Matching → licensed vet by state/species
      ├── PIMS Integration → Cornerstone/Avimark API
      ├── IoT Hub → feeder schedule push, event ingestion
      └── Insurance Gateway → Trupanion/Lemonade claims API
      │
      ▼
[Vet Portal] — SOAP notes, Rx, follow-up scheduling
```

```python
# Whistle webhook handler for pet location events
from fastapi import FastAPI, Request
import httpx

app = FastAPI()

@app.post("/webhooks/whistle")
async def handle_whistle_event(request: Request):
    event = await request.json()
    if event["type"] == "location_update":
        pet_id = event["pet_id"]
        lat, lng = event["latitude"], event["longitude"]
        await update_pet_location(pet_id, lat, lng)
        if await is_outside_safe_zone(pet_id, lat, lng):
            await send_escape_alert(pet_id)
    return {"status": "ok"}
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| Petvisor (PetDesk + Vetstoria) | Practice management, client comms, online booking | Per-location SaaS subscription |
| Whistle | GPS + health tracking collar, activity API | $9.95/mo + hardware |
| Fi | Smart dog collar, GPS + activity, webhook API | $99/yr subscription + hardware |
| Trupanion | Pet insurance claims API, direct vet pay | Per-policy commission to integrators |
| PetDesk | Vet client engagement, reminders, 2-way SMS | Per-location monthly SaaS |

## Related Skills
- `backend-development` — IoT event ingestion, webhook handlers, PIMS API integration
- `databases` — Pet health record storage, time-series activity data
- `eldercare-aging-tech` — Shared patterns: RPM → pet vitals monitoring, FHIR-lite records
