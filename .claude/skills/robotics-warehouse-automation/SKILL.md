---
name: robotics-warehouse-automation
description: "Warehouse robotics, AMR (autonomous mobile robots), pick-and-place, WMS integration — activate when building warehouse management systems, robot fleet orchestration, or fulfillment center automation software"
source: research-driven-2026
license: MIT
version: 1.0.0
---

# Robotics & Warehouse Automation — Skill

> AMR deployments grew 35% YoY in 2025 as labor shortages and e-commerce growth accelerated; software-defined fulfillment centers with robot-human collaboration became the new standard.

## When to Activate
- Building or integrating with a Warehouse Management System (WMS)
- Orchestrating fleets of AMRs (autonomous mobile robots)
- Designing pick-and-place task allocation and path planning algorithms
- Integrating robotic systems with ERP/OMS via APIs (SAP, Oracle, NetSuite)
- Implementing real-time inventory tracking via RFID, computer vision, or barcode
- Building digital twin simulations for warehouse layout optimization
- Developing safety systems for human-robot collaboration zones

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Fleet Management | AMR task dispatching, traffic management, charging coordination | Locus Robotics, 6RS Chuck, Fetch FMS |
| Path Planning | Multi-robot MAPF (multi-agent pathfinding), collision avoidance | OR-Tools, CBS algorithm, ROS2 Nav2 |
| Pick Optimization | Order batching, wave planning, slotting optimization | Covariant AI, Ambi Robotics |
| WMS Integration | REST/SOAP APIs for task injection and inventory sync | SAP EWM, Manhattan, Blue Yonder |
| Computer Vision | Barcode/QR scanning, damage detection, object recognition | AWS Rekognition, Azure Custom Vision |
| Digital Twin | 3D warehouse simulation for layout and throughput optimization | NVIDIA Omniverse, Siemens Tecnomatix |

## Architecture Patterns
```
[OMS / ERP] — order released
      │ REST webhook
      ▼
[WMS] — wave planning, pick list generation
      │ task API
      ▼
[Fleet Management System (FMS)]
      ├── AMR Task Queue (priority + zone assignment)
      ├── Traffic Control (virtual lanes, intersection locks)
      └── Charging Scheduler
      │ robot command (MiR, Locus, Fetch REST/ROS2)
      ▼
[AMR Robot] → navigate → pick → deposit → confirm
      │ telemetry (position, battery, task status)
      ▼
[WMS] — inventory update → ERP sync
```

```python
# Locus Robotics-style task injection
import httpx

async def dispatch_pick_task(robot_id: str, pick_location: str, sku: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://fms.warehouse.local/api/v2/tasks",
            json={
                "robot_id": robot_id,
                "task_type": "pick",
                "location": pick_location,
                "payload": {"sku": sku, "quantity": 1},
                "priority": 5,
            },
            headers={"Authorization": f"Bearer {API_TOKEN}"},
        )
    return response.json()
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| Amazon Robotics | Kiva-style drive-unit AMRs for Amazon network | Internal; Sequoia system |
| Locus Robotics | LocusBot AMRs, multi-client fulfillment | Robot-as-a-service (RaaS) subscription |
| 6 River Systems (Shopify) | Chuck AMRs with collaborative picking UI | Per-robot lease |
| Fetch Robotics (Zebra) | Data collection + material transport AMRs | Hardware + software subscription |
| Covariant | AI-powered robotic picking (unstructured SKUs) | Per-pick pricing model |

## Related Skills
- `last-mile-delivery-logistics` — Handoff from warehouse to delivery fleet
- `databases` — Real-time inventory state management and event sourcing
- `backend-development` — FMS API design and robot telemetry ingestion
