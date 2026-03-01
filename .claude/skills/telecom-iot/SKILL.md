---
name: telecom-iot
description: IoT platforms, communication APIs, MQTT, edge computing, device management, 5G. Use for connected devices, smart infrastructure, telco apps, sensor networks.
license: MIT
version: 1.0.0
---

# Telecom & IoT Skill

Build connected device platforms, communication services, and IoT infrastructure with modern protocols and edge computing.

## When to Use

- IoT device management and fleet provisioning
- Communication APIs (voice, SMS, video)
- MQTT broker setup and message routing
- Edge computing and fog architecture
- Smart home/building automation
- Industrial IoT (IIoT) monitoring
- OTA firmware update pipelines
- Sensor data ingestion and time-series analytics
- 5G/cellular connectivity for devices
- Network monitoring and observability

## Tool Selection

| Need | Choose |
|------|--------|
| IoT platform | AWS IoT Core, Azure IoT Hub, Google Cloud IoT |
| Device management | Balena (container-based), Particle, EMnify |
| Communication APIs | Twilio, Vonage (Nexmo), Bandwidth, Plivo |
| MQTT broker | HiveMQ Cloud, EMQX, Mosquitto (self-hosted) |
| Edge runtime | AWS Greengrass, Azure IoT Edge, KubeEdge |
| Time-series DB | InfluxDB, TimescaleDB, QuestDB |
| Cellular IoT | Hologram, EMnify, 1NCE (flat-rate IoT SIM) |
| OTA updates | Mender.io (open-source), Balena, JFrog Connect |
| Protocol gateway | Eclipse Hono, ThingsBoard |
| Monitoring | Grafana + Prometheus, Datadog IoT |

## IoT Architecture

```
Devices/Sensors
    ↓ (MQTT/CoAP/HTTP)
Edge Gateway (data filtering, local processing)
    ↓ (MQTT/AMQP)
Cloud IoT Hub (device registry, message routing)
    ↓
┌────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Stream   │  │ Rules    │  │ Device   │ │
│  │ Process  │  │ Engine   │  │ Shadow   │ │
│  │ (Kafka)  │  │ (Lambda) │  │ (Twin)   │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└────────────────────────────────────────────┘
    ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Time-    │  │ Alerts/  │  │ ML/      │
│ Series   │  │ Actions  │  │ Analytics│
│ (Influx) │  │ (SNS)    │  │ (Sage)   │
└──────────┘  └──────────┘  └──────────┘
```

## MQTT Integration Pattern

```python
# Paho MQTT client (Python)
import paho.mqtt.client as mqtt
import json

def on_connect(client, userdata, flags, rc):
    client.subscribe("sensors/+/telemetry")  # Wildcard subscription

def on_message(client, userdata, msg):
    data = json.loads(msg.payload)
    # Route to time-series DB
    influx_write(
        measurement="sensor_reading",
        tags={"device_id": msg.topic.split("/")[1]},
        fields={"temperature": data["temp"], "humidity": data["hum"]},
        time=data["timestamp"]
    )

client = mqtt.Client(protocol=mqtt.MQTTv5)
client.tls_set()  # Enable TLS
client.username_pw_set("device_id", "device_token")
client.on_connect = on_connect
client.on_message = on_message
client.connect("broker.hivemq.cloud", 8883)
client.loop_forever()
```

## Device Provisioning Flow

```
1. Manufacturing → Burn unique device cert + ID
2. First boot → Device connects to provisioning endpoint
3. Cloud validates cert → Creates device twin/shadow
4. Device receives config (MQTT topics, firmware version, reporting interval)
5. OTA check → Download latest firmware if needed
6. Operational → Starts sending telemetry
```

## Communication API Pattern (Twilio)

```python
from twilio.rest import Client

client = Client("ACCOUNT_SID", "AUTH_TOKEN")

# Send SMS
message = client.messages.create(
    body="Your device alert: temperature exceeded 80°C",
    from_="+1234567890",
    to="+0987654321"
)

# Programmable voice (TwiML webhook)
# POST /voice-webhook → return TwiML XML for IVR
```

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Device Uptime | Online time / Total time | > 99.5% |
| Message Delivery Rate | Delivered / Sent messages | > 99.9% |
| Latency (edge→cloud) | P99 message delivery time | < 500ms |
| OTA Success Rate | Successful updates / Attempted | > 98% |
| Data Throughput | Messages per second per device | Per use case |
| Battery Life | Estimated device battery duration | > 1 year (LPWAN) |
| Connectivity Cost | Monthly cost per device | < $1 (IoT SIM) |
| False Alarm Rate | False alerts / Total alerts | < 5% |
| Fleet Size | Total managed devices | Scale metric |
| MTBF | Mean time between failures | > 10,000 hours |

## Protocol Comparison

| Protocol | Use Case | Overhead | QoS |
|----------|----------|----------|-----|
| MQTT | Most IoT telemetry | Low (2 bytes header) | 0/1/2 |
| CoAP | Constrained devices, UDP | Very low | Confirmable |
| HTTP/REST | Cloud-to-device commands | High | N/A |
| AMQP | Enterprise message queuing | Medium | Transactional |
| WebSocket | Real-time dashboards | Medium | N/A |
| LoRaWAN | Long-range, low-power | Very low | N/A |
| LwM2M | Device management | Low | Bootstrap |

## References

- AWS IoT: https://docs.aws.amazon.com/iot
- HiveMQ: https://docs.hivemq.com
- Balena: https://docs.balena.io
- Twilio: https://www.twilio.com/docs
- InfluxDB: https://docs.influxdata.com
- Mender.io: https://docs.mender.io
