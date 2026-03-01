---
name: autonomous-drone-uav
description: "Autonomous drones & UAV fleet management — aerial mapping, delivery drones, inspection automation, flight planning, BVLOS operations. Activate when building drone dispatch systems, aerial analytics pipelines, or UAV fleet dashboards."
source: research-driven-2026
license: MIT
version: 1.0.0
---

# Autonomous Drone & UAV — Skill

> Commercial drone market reaches $54B by 2030; FAA BVLOS (Beyond Visual Line of Sight) rule finalization in 2025 unlocked large-scale delivery and inspection deployments.

## When to Activate
- Building drone fleet dispatch or mission planning systems
- Integrating DJI SDK or third-party UAV telemetry streams
- Designing aerial inspection workflows (power lines, wind turbines, bridges)
- Implementing photogrammetry or orthomosaic processing pipelines
- Creating last-mile drone delivery management platforms
- Building airspace deconfliction and UTM (UAS Traffic Management) integrations
- Automating drone-collected imagery with AI object detection

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Fleet Management | Multi-drone dispatch, mission queue, battery/dock management | Skydio Fleet, DJI FlightHub 2 |
| Flight Planning | Waypoint mission generation, terrain following, obstacle avoidance | DJI Mobile SDK, DroneLink |
| Telemetry Streaming | Real-time GPS, attitude, battery, video feed ingestion | MAVLink, DJI MSDK, WebRTC |
| Photogrammetry | Point cloud, orthomosaic, DSM generation from aerial imagery | Pix4D, OpenDroneMap, Agisoft |
| AI Inspection | Defect detection on infrastructure imagery, anomaly flagging | Percepto, Léa AI, Azure Custom Vision |
| UTM Integration | Airspace authorization, LAANC approval, conflict detection | AirMap, Airspace Link, Wing UTM |

## Architecture Patterns
```python
# Drone inspection mission dispatch pattern
async def dispatch_inspection_mission(asset_id: str, drone_id: str) -> MissionResult:
    asset = await asset_registry.get(asset_id)

    # Generate waypoint path along asset geometry
    waypoints = FlightPlanner.generate_inspection_path(
        geometry=asset.geometry, altitude_m=30, overlap_pct=0.75
    )

    # LAANC airspace check
    auth = await airspace_link.request_authorization(waypoints.bounding_box, altitude_m=30)
    if not auth.approved:
        raise AirspaceError(f"Authorization denied: {auth.reason}")

    # Dispatch mission to drone
    mission_id = await fleet_manager.upload_mission(drone_id, waypoints)
    await fleet_manager.start_mission(drone_id, mission_id)

    # Stream telemetry until complete
    async for telemetry in fleet_manager.stream(drone_id, mission_id):
        await telemetry_store.write(telemetry)

    # Trigger photogrammetry processing
    imagery = await fleet_manager.download_imagery(drone_id, mission_id)
    report = await pix4d.process_inspection(imagery, asset_type=asset.type)
    return MissionResult(mission_id=mission_id, defects=report.defects, orthomosaic_url=report.url)
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| DJI SDK (Mobile + Payload) | Hardware control, camera, gimbal, telemetry | Free SDK, hardware cost |
| Skydio | Autonomous inspection drones, Fleet API | Hardware + SaaS |
| Wing (Alphabet) | Delivery drone operations, UTM | Partner program |
| Wingtra | Fixed-wing VTOL for large-area mapping | Hardware + Pix4D |
| DroneUp | FAA waiver management, BVLOS operations | Enterprise |
| AirMap | UTM platform, LAANC authorization API | API credits |

## Related Skills
- `agri-tech-precision-farming` — Crop scouting drone missions, NDVI mapping
- `smart-city-urban-tech` — Urban airspace management, city infrastructure inspection
- `autonomous-fleet-ops` — Multi-vehicle fleet coordination patterns
