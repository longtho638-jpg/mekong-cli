---
name: smart-city-urban-tech
description: "Smart city infrastructure — digital twin cities, urban mobility, smart grid, IoT sensor networks, public safety analytics. Activate when building city data platforms, mobility apps, or urban infrastructure dashboards."
source: research-driven-2026
license: MIT
version: 1.0.0
---

# Smart City & Urban Tech — Skill

> Smart city spending reaches $1.1T by 2027; 60% of new city projects now mandate open data APIs and digital twin integration.

## When to Activate
- Building urban IoT sensor data ingestion pipelines
- Designing digital twin dashboards for city infrastructure
- Integrating traffic, transit, or mobility data feeds
- Implementing smart grid energy management systems
- Building public safety analytics or incident response tools
- Creating geospatial mapping layers for city planners
- Aggregating air quality, noise, or environmental sensor data

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Digital Twin | Real-time 3D city model sync, infrastructure simulation | Cityzenith 5D, PTC ThingWorx, Unity Reflect |
| Urban Mobility | Transit GTFS feeds, traffic signal control, multimodal routing | HERE API, TomTom, GTFS-RT |
| Smart Grid | Demand response, outage prediction, EV charging integration | Itron, Landis+Gyr, OpenADR |
| IoT Sensor Network | LoRaWAN/NB-IoT device management, time-series ingestion | AWS IoT Core, Azure IoT Hub, InfluxDB |
| Geospatial Analytics | Heatmaps, zoning analysis, spatial queries | ESRI ArcGIS, PostGIS, Mapbox |
| Public Safety | Anomaly detection on CCTV feeds, incident clustering | Avigilon, Motorola Rave |

## Architecture Patterns
```python
# Urban IoT event ingestion with anomaly alerting
async def process_sensor_event(event: SensorEvent) -> None:
    # Write to time-series store
    await influx.write(
        measurement=event.sensor_type,
        tags={"zone": event.zone_id, "device": event.device_id},
        fields={"value": event.reading, "unit": event.unit},
        timestamp=event.ts
    )
    # Threshold alert
    threshold = await city_config.get_threshold(event.sensor_type, event.zone_id)
    if event.reading > threshold.critical:
        await alert_bus.publish(CityAlert(zone=event.zone_id, severity="critical", reading=event.reading))
    # Sync digital twin
    await digital_twin.patch_asset(event.device_id, {"last_reading": event.reading})
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| ESRI ArcGIS | Geospatial mapping, city GIS layers | Subscription + API credits |
| PTC ThingWorx | Industrial IoT platform, digital twin | Enterprise license |
| Cityzenith 5D | Urban digital twin SaaS | Enterprise |
| HERE API | Traffic, routing, transit data | Per-request |
| AWS IoT Core | Device management, MQTT broker | Per-message |
| Sidewalk Labs (Alphabet) | Urban innovation toolkits | Open source / partner |

## Related Skills
- `autonomous-drone-uav` — Aerial city inspection, traffic monitoring drones
- `wearable-health-iot` — Environmental health data from citizen wearables
- `circular-economy-waste-tech` — Smart waste bin sensors, collection route optimization
