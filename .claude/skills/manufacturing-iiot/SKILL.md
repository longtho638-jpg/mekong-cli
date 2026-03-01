---
name: manufacturing-iiot
description: MES, predictive maintenance, digital twins, SCADA, OPC-UA, robotics, computer vision inspection, supply chain visibility. Use for smart factories, Industry 4.0, manufacturing platforms.
license: MIT
version: 1.0.0
---

# Manufacturing & Industrial IoT Skill

Build smart factory systems, predictive maintenance platforms, digital twins, and Industry 4.0 applications with OPC-UA and modern IIoT protocols.

## When to Use

- Manufacturing Execution System (MES) implementation
- Predictive maintenance and machine health monitoring
- Digital twin creation and simulation
- SCADA modernization and cloud migration
- OPC-UA protocol integration
- Robotics and cobots programming (ROS2)
- Computer vision for quality inspection
- Supply chain visibility and planning
- Quality Management System (QMS) setup
- Industrial IoT data pipeline

## Tool Selection

| Need | Choose |
|------|--------|
| MES (no-code) | Tulip (REST/MQTT, composable) |
| MES (cloud) | Plex (cloud-native), DELMIAworks (hybrid) |
| Predictive maintenance | Augury (ML health), Senseye (Siemens, gen AI) |
| Digital twin (industrial) | Siemens MindSphere, NVIDIA Omniverse |
| Digital twin (cloud) | Azure Digital Twins (graph model, SDK) |
| IIoT platform | AWS IoT SiteWise, PTC ThingWorx |
| SCADA | Ignition 8.3 (REST API, Git workflows, OPC-UA) |
| QMS | Arena Solutions (PLM+QMS), MasterControl (AI) |
| Supply chain | o9 Solutions (knowledge graph), Kinaxis Maestro |
| Robotics | Universal Robots (ROS2), ROS2 (middleware) |
| Computer vision | Cognex (In-Sight 3800), Landing AI (small-data) |
| Protocol gateway | OPC-UA + MQTT bridge, Kepware |

## Industry 4.0 Architecture

```
Shop Floor (Sensors, PLCs, Machines, Robots)
    ↓ (OPC-UA / MQTT / Modbus)
┌────────────────────────────────────────────┐
│  Edge Layer                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ SCADA    │  │ Edge     │  │ Vision   │ │
│  │ (Ignit.) │  │ Compute  │  │ Inspect  │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓ (MQTT / OPC-UA Pub/Sub)
┌────────────────────────────────────────────┐
│  Cloud Platform (MindSphere / AWS IoT)      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Digital  │  │ Predict. │  │ MES      │ │
│  │ Twin     │  │ Maint.   │  │ Tracking │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Supply   │  │ Quality  │  │ Analytics│
│ Chain    │  │ Mgmt     │  │ Dashboard│
└──────────┘  └──────────┘  └──────────┘
```

## OPC-UA Integration Pattern

```python
from opcua import Client

# Connect to OPC-UA server (Ignition, Kepware, etc.)
client = Client("opc.tcp://plc-server:4840")
client.connect()

try:
    # Browse namespace
    root = client.get_root_node()
    objects = client.get_objects_node()

    # Read sensor data
    temp_node = client.get_node("ns=2;s=Machine1.Temperature")
    temperature = temp_node.get_value()  # 72.5°C

    # Read production counter
    counter_node = client.get_node("ns=2;s=Machine1.PartCount")
    parts_made = counter_node.get_value()  # 1542

    # Subscribe to data changes (real-time monitoring)
    handler = DataChangeHandler()
    sub = client.create_subscription(500, handler)  # 500ms interval
    sub.subscribe_data_change(temp_node)
finally:
    client.disconnect()
```

## Industrial Protocols

| Protocol | Use Case | Data Model | Status |
|----------|----------|------------|--------|
| OPC-UA | Machine-to-cloud, universal | Information model + pub/sub | $18.3B market 2026 |
| MQTT | Lightweight telemetry | Topic-based pub/sub | Standard for IIoT |
| Modbus TCP | Legacy PLC communication | Register-based | Legacy, widespread |
| PROFINET | Real-time Ethernet | Process data | Industrial Ethernet |
| EtherNet/IP | CIP over Ethernet | Object model | Rockwell ecosystem |
| OPC-UA over TSN | Deterministic real-time | Time-sensitive pub/sub | Emerging 2026 |

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| OEE | Availability × Performance × Quality | > 85% |
| MTBF | Total uptime / Number of failures | Increasing |
| MTTR | Total repair time / Number of repairs | < 4 hours |
| Defect Rate | Defective / Total produced | < 0.1% (Six Sigma) |
| Unplanned Downtime | Unplanned stops / Total time | < 5% |
| Predictive Accuracy | Correct predictions / Total | > 90% |
| Cycle Time | Start → Finish per unit | Benchmark per product |
| Inventory Turns | COGS / Average inventory | Industry-dependent |

## References

- Tulip: https://tulip.co/docs
- Ignition: https://docs.inductiveautomation.com
- Azure Digital Twins: https://learn.microsoft.com/azure/digital-twins
- AWS IoT SiteWise: https://docs.aws.amazon.com/iot-sitewise
- NVIDIA Omniverse: https://developer.nvidia.com/omniverse
- OPC Foundation: https://opcfoundation.org
- ROS2: https://docs.ros.org
- Cognex: https://www.cognex.com/products
- Landing AI: https://landing.ai
