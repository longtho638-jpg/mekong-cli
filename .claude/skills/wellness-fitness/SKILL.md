---
name: wellness-fitness
description: Health tech, wearable integration, fitness platforms, wellness apps, mental health, nutrition tracking. Use for health & wellness products, fitness SaaS, wearable-connected apps.
license: MIT
version: 1.0.0
---

# Wellness & Fitness Technology Skill

Build health & wellness platforms, fitness applications, wearable integrations, and mental health tools with modern health data APIs.

## When to Use

- Fitness tracking and workout platform development
- Wearable device data integration (Apple Health, Google Fit, Fitbit)
- Mental health and meditation app development
- Nutrition tracking and meal planning
- Telehealth and virtual wellness coaching
- Corporate wellness program platforms
- Sleep tracking and analysis
- Health data aggregation and analytics
- Habit tracking and behavior change apps
- Gym and studio management software

## Tool Selection

| Need | Choose |
|------|--------|
| Health data aggregation | Terra API (unified wearable data), Vital |
| Apple Health integration | HealthKit (iOS native SDK) |
| Google Fit | Health Connect API (Android) |
| Wearable data | Fitbit Web API, Garmin Connect API, Whoop API |
| Workout content | ExerciseDB API, wger API (open-source) |
| Gym management | Mindbody API, Glofox, Pike13 |
| Meditation/mindfulness | Calm Business API, Headspace (B2B) |
| Nutrition data | Nutritionix API, FatSecret API, USDA FoodData Central |
| Telehealth video | Twilio Video, Doxy.me API, Zoom Health |
| Corporate wellness | Virgin Pulse, Wellable, Limeade |

## Wellness App Architecture

```
User (Mobile App / Web)
    ↓
┌────────────────────────────────────────────┐
│  App Layer                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Workout  │  │ Nutrition│  │ Mental   │ │
│  │ Tracker  │  │ Logger   │  │ Health   │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌────────────────────────────────────────────┐
│  Data Integration (Terra API / HealthKit)   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Wearable │  │ Sleep    │  │ Heart    │ │
│  │ Sync     │  │ Data     │  │ Rate/HRV │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ AI Coach │  │ Progress │  │ Social   │
│ Engine   │  │ Analytics│  │ Features │
└──────────┘  └──────────┘  └──────────┘
```

## Terra API Integration (Unified Wearable Data)

```python
from terra.base_client import Terra

terra = Terra(api_key="API_KEY", dev_id="DEV_ID", secret="SECRET")

# Generate auth widget for user to connect wearable
widget = terra.generate_widget_session(
    reference_id="user_123",
    providers=["FITBIT", "GARMIN", "APPLE", "WHOOP", "OURA"],
    language="en"
)
# widget.url → redirect user to connect device

# Get user activity data
activity = terra.get_activity(
    user_id="terra_user_id",
    start_date="2026-03-01",
    end_date="2026-03-01"
)
# activity.data → steps, calories, distance, active_duration
```

## Health Data Standards

| Standard | Use Case | Protocol |
|----------|----------|----------|
| HL7 FHIR R4 | Clinical data exchange | REST + JSON |
| Apple HealthKit | iOS health data access | Native Swift SDK |
| Health Connect | Android health data | Android SDK (Kotlin) |
| Open mHealth | Wearable data schemas | JSON Schema |
| IEEE 11073 | Medical device communication | Binary protocol |

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| DAU/MAU Ratio | Daily active / Monthly active | > 30% |
| Workout Completion | Completed / Started workouts | > 70% |
| Streak Retention | Users with 7+ day streaks | > 25% |
| Wearable Sync Rate | Auto-synced / Total users | > 80% |
| Health Score Improvement | Avg score change over 30d | Positive trend |
| Churn Rate (monthly) | Lost users / Total users | < 8% |
| NPS Score | Promoters - Detractors | > 50 |
| Session Duration | Avg time in app per session | 5-15 min |

## References

- Terra API: https://docs.tryterra.co
- Apple HealthKit: https://developer.apple.com/healthkit
- Health Connect: https://developer.android.com/health-and-fitness/guides
- Nutritionix API: https://www.nutritionix.com/business/api
- ExerciseDB: https://exercisedb.io
- Mindbody API: https://developers.mindbodyonline.com
- USDA FoodData: https://fdc.nal.usda.gov/api-guide
- Vital: https://docs.tryvital.io
