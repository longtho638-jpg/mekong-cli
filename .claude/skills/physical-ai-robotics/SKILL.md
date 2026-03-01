# Physical AI & Robotics Operations

Software layer for humanoid robot orchestration, warehouse automation, RaaS billing, fleet telemetry.

## When to Use
- Robot fleet management and health monitoring
- Task queue management and mission dispatch for robots
- Robot-as-a-Service (RaaS) subscription billing
- Safety compliance and incident reporting
- Multi-robot coordination and workload balancing

## Key Patterns
- **Protocols**: ROS 2, gRPC, MQTT, OPC-UA
- **Fleet Mgmt**: heartbeat monitoring, OTA firmware, task allocation
- **Safety**: ISO 10218, ISO/TS 15066 collaborative safety
- **Telemetry**: sensor fusion, predictive maintenance, anomaly detection

## Architecture
```
Fleet Dashboard → Mission Dispatcher → Robot Controllers (ROS 2)
      ↓                ↓                      ↓
  Telemetry       Task Queue           Sensor Fusion
  Collector      (priority-based)      & Localization
      ↓                                      ↓
Safety Monitor ← Incident Reporter    Predictive Maintenance
```

## SDK
`@agencyos/vibe-physical-ai` — fleet telemetry, mission dispatch, RaaS billing hooks
