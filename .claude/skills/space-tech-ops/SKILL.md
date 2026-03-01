# Space Economy & Satellite Operations

Satellite constellation management, orbital data pipelines, launch coordination, space-as-a-service.

## When to Use
- Satellite TLE tracking and constellation health monitoring
- Earth observation data ingestion and processing pipelines
- Launch slot booking and manifest coordination
- Ground station scheduling and contact management
- Space debris avoidance and collision risk alerts

## Key Patterns
- **Protocols**: CCSDS, SpacePacket, TLE/OMM, CZML
- **Data**: COG (Cloud Optimized GeoTIFF), STAC catalog, Zarr
- **Platforms**: AWS Ground Station, Azure Orbital, Leaf Space
- **Standards**: ITU frequency coordination, IADC debris guidelines

## Architecture
```
Constellation Fleet → TLE Tracker → Health Dashboard
        ↓                  ↓                ↓
Ground Station      Orbit Predictor    Conjunction Alerts
Scheduler               ↓              (debris avoidance)
        ↓         EO Data Pipeline
Contact Mgmt    (ingest → process → catalog)
```

## SDK
`@agencyos/vibe-space-tech` — constellation tracking, ground station scheduling, EO pipeline hooks
