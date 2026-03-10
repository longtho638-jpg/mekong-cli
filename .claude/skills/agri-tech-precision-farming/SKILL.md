---
name: agri-tech-precision-farming
description: "Precision agriculture — crop monitoring, soil sensors, drone mapping, yield prediction, farm management APIs. Activate when building agri dashboards, farm IoT pipelines, or crop analytics platforms."
source: research-driven-2026
license: MIT
version: 1.0.0
---

# AgriTech & Precision Farming — Skill

> Precision agriculture market reaches $16.4B by 2028; AI-driven yield prediction now delivers 15-20% crop loss reduction for early adopters.

## When to Activate
- Building farm management information systems (FMIS)
- Ingesting soil sensor, weather, or satellite imagery data
- Designing drone mapping or NDVI analysis pipelines
- Implementing yield prediction or harvest planning models
- Integrating with tractor/equipment telematics (John Deere Operations Center)
- Creating pest/disease detection from field imagery
- Building irrigation scheduling or water management systems

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Crop Monitoring | NDVI/EVI satellite analysis, canopy health scoring | Planet Labs API, Sentinel Hub, Arable |
| Soil Intelligence | Moisture, pH, NPK sensor ingestion, prescription maps | Farmers Edge, CropX, Teralytic |
| Drone Mapping | Flight planning, orthomosaic stitching, anomaly detection | DJI SDK, Wingtra, Pix4D |
| Yield Prediction | ML models on weather + soil + historical yield data | Climate Corp (Bayer), IBM PAIRS |
| Equipment Telematics | Machine data, field ops logging, variable rate application | John Deere Operations Center API |
| Weather Integration | Hyperlocal forecast, frost alerts, growing degree days | Tomorrow.io, Open-Meteo |

## Architecture Patterns
```python
# Yield prediction pipeline pattern
async def predict_yield(field_id: str, season: str) -> YieldForecast:
    # Fetch multi-source field data
    soil = await soil_api.get_profile(field_id)          # NPK, pH, moisture
    ndvi_series = await sentinel_hub.get_ndvi_timeseries(field_id, season)
    weather = await tomorrow_io.get_seasonal_forecast(field_id)

    # Feature engineering
    features = FeatureBuilder().add_soil(soil).add_ndvi(ndvi_series).add_weather(weather).build()

    # ML inference
    predicted_bushels = await yield_model.predict(features)
    confidence = yield_model.confidence_interval(features, p=0.90)

    return YieldForecast(field_id=field_id, predicted=predicted_bushels, ci_90=confidence)
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| John Deere Operations Center API | Equipment telematics, field ops data | Partner program |
| Climate Corp (Bayer) | Weather risk, yield modeling SaaS | Subscription |
| Farmers Edge | Soil sensing + digital agronomy platform | Per-acre |
| Arable | In-field microclimate + crop growth sensors | Hardware + SaaS |
| Taranis | AI-powered crop disease / pest imagery | Per-acre subscription |
| Sentinel Hub | Satellite imagery (Sentinel-2, Landsat) | API credits |

## Related Skills
- `autonomous-drone-uav` — Drone fleet dispatch for field scouting and mapping
- `smart-city-urban-tech` — IoT sensor networks, LoRaWAN device management patterns
- `circular-economy-waste-tech` — Agricultural waste streams, food loss reduction
