# Robotics Automation — Skill

> ROS2-based robot fleet management, digital twin modeling, predictive maintenance, and industrial IoT edge computing.

## When to Activate
- Integrating ROS2 nodes, topics, services, or actions into a software system
- Building robot fleet management dashboards or autonomous mission dispatch systems
- Implementing predictive maintenance pipelines using vibration, temperature, or OEE sensor data
- Designing digital twin models synchronized with physical assets in real time
- Developing industrial IoT edge computing architectures with OPC-UA or MQTT brokers

## Core Capabilities

| Area | Description |
|------|-------------|
| ROS2 Integration | Node lifecycle management, topic pub/sub, service/action clients, DDS configuration |
| Fleet Management | Multi-robot task allocation (MRTA), collision-free path planning, fleet health monitoring |
| Predictive Maintenance | Anomaly detection on vibration/thermal time-series; remaining useful life (RUL) models |
| Digital Twins | Real-time asset state synchronization, simulation-to-real gap calibration, scenario replay |
| Industrial IoT Edge | OPC-UA server bridging, MQTT broker (EMQX/Mosquitto), edge inference with ONNX Runtime |

## Architecture Patterns

- **ROS2 + Cloud Bridge:** ROS2 DDS (Fast-DDS) → ros2-mqtt-bridge → EMQX cloud → time-series DB (InfluxDB) → Grafana dashboard
- **Fleet Dispatch Loop:** Mission queue → MRTA solver (Hungarian / auction algorithm) → waypoint assignment → robot nav2 action client → status telemetry → completion callback
- **Predictive Maintenance Pipeline:** Sensor stream (vibration/temperature) → edge feature extraction (FFT, RMS) → ONNX model inference → RUL prediction → maintenance work order API
- **Digital Twin Sync:** Physical asset OPC-UA tags → tag mapper → state diff engine → twin model update → simulation trigger on state change → replay and analysis

## Key Technologies

- **Robotics:** ROS2 (Humble/Iron), Nav2, MoveIt2, micro-ROS for embedded MCUs
- **Simulation:** Gazebo Harmonic, Isaac Sim, Webots for digital twin and testing
- **Industrial Protocols:** OPC-UA (open62541, node-opcua), MQTT, Modbus TCP, EtherCAT
- **Edge Compute:** NVIDIA Jetson, ROS2 + ONNX Runtime, Docker on ARM64, AWS Greengrass
- **Time-Series:** InfluxDB + Telegraf, TimescaleDB, Apache Kafka for streaming telemetry
- **Fleet Orchestration:** Kubernetes (K3s on edge), Fleet API, RobotFramework for acceptance tests

## Implementation Checklist

- [ ] Define ROS2 QoS profiles per topic — reliability (reliable vs best-effort) and durability matching
- [ ] Set up DDS domain isolation (ROS_DOMAIN_ID) per robot cell to prevent topic bleed
- [ ] Implement robot health watchdog — heartbeat topic → missed beat → fleet manager escalation
- [ ] Build sensor data normalization layer — unit standardization before ML model ingestion
- [ ] Train anomaly detection model on healthy baseline data (minimum 30 days historical)
- [ ] Set up digital twin state sync with configurable resolution — not all tags need 1Hz update
- [ ] Implement OPC-UA security (certificate-based auth, encrypted channels) — industrial compliance
- [ ] Deploy edge inference model with fallback to cloud API when local GPU unavailable

## Best Practices

- Use lifecycle nodes (ROS2) for all stateful components — managed startup/shutdown prevents race conditions
- Store robot mission logs with correlation IDs — enables post-mortem replay in simulation
- Apply change data capture (CDC) for digital twin updates — only push diffs, not full state, to reduce bandwidth
- Calibrate sensor drift monthly — predictive maintenance models degrade silently with uncalibrated inputs
- Design for degraded-mode operation — robot must safe-stop gracefully when cloud connectivity is lost

## Anti-Patterns

- Never publish high-frequency sensor data (>100Hz) without edge aggregation — saturates DDS network
- Avoid hardcoding robot waypoints — use map-relative coordinates + AMCL localization for re-deployability
- Do not run ML inference on robot's primary compute thread — use dedicated node with priority scheduling
- Avoid proprietary industrial protocols as the sole integration path — always add OPC-UA as open standard fallback
- Do not skip HIL (hardware-in-the-loop) testing before fleet deployment — simulation does not capture all real-world edge cases
