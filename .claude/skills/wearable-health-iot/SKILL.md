---
name: wearable-health-iot
description: "Wearable health devices — continuous glucose monitors, ECG patches, sleep tracking, biometric auth, HealthKit/Health Connect integration. Activate when building health apps ingesting wearable data, remote patient monitoring, or biometric pipelines."
source: research-driven-2026
license: MIT
version: 1.0.0
---

# Wearable Health & IoT — Skill

> Digital health wearables market reaches $186B by 2028; FDA cleared 510(k) wearables and CGM adoption tripled in 2024-2025 driven by GLP-1 drug monitoring demand.

## When to Activate
- Integrating Apple HealthKit, Google Health Connect, or Garmin Health API
- Building continuous glucose monitor (CGM) data pipelines
- Implementing remote patient monitoring (RPM) dashboards
- Designing biometric authentication using heart rate / HRV signatures
- Creating sleep quality analysis or recovery scoring features
- Building cardiac event detection from ECG patch data
- Aggregating multi-device health data into unified longitudinal records

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Platform Integration | Unified health data ingestion from OS-level health stores | Apple HealthKit, Google Health Connect |
| CGM Integration | Real-time glucose readings, trend arrows, alerts | Dexcom G7 API, Abbott LibreView API |
| Activity & Sleep | Steps, HRV, sleep stages, SpO2, recovery scores | Garmin Health API, Whoop API, Oura API |
| Cardiac Monitoring | ECG classification, AFib detection, arrhythmia alerts | AliveCor KardiaMobile SDK, iRhythm |
| FHIR Interoperability | HL7 FHIR R4 patient resource mapping, EHR integration | Apple Health Records, Epic MyChart |
| Biometric Auth | Continuous auth via gait, HRV, typing cadence | Aware, BioVerify |

## Architecture Patterns
```swift
// Apple HealthKit permission + batch read pattern (iOS)
func fetchDailyMetrics(for date: Date) async throws -> DailyHealthSummary {
    let store = HKHealthStore()
    let types: Set<HKObjectType> = [
        HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!,
        HKObjectType.quantityType(forIdentifier: .stepCount)!,
        HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
    ]
    try await store.requestAuthorization(toShare: [], read: types)

    async let hrv = store.statistics(for: .heartRateVariabilitySDNN, on: date)
    async let steps = store.statistics(for: .stepCount, on: date)
    async let sleep = store.sleepSamples(on: date)

    return DailyHealthSummary(hrv: try await hrv, steps: try await steps, sleep: try await sleep)
}
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| Apple HealthKit | iOS health data aggregation, HealthKit permissions | Free (Apple developer) |
| Google Health Connect | Android health data aggregation | Free (Google Play) |
| Garmin Health API | Activity, sleep, stress, body battery data | Partner program |
| Dexcom G7 API | Real-time CGM glucose data stream | Developer program |
| Whoop API | Recovery, strain, sleep performance metrics | Developer access |
| Oura API | Ring-based sleep, readiness, activity scores | OAuth + per-user |

## Related Skills
- `digital-health` — Clinical workflow integration, HIPAA compliance, FHIR APIs
- `insurtech` — UBI health insurance, CGM-linked premium adjustments
- `regtech` — HIPAA/GDPR compliance for health data processing
