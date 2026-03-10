---
name: telecom-hub-sdk
description: Unified Telecom SDK — network management, IoT device fleets, subscriber billing, 5G, LoRaWAN. Use for telco platforms, IoT hubs, device management, network ops.
license: MIT
version: 1.0.0
---

# Telecom Hub SDK Skill

Build telecom platforms, IoT device management, and subscriber billing systems.

## When to Use

- Network management and 5G infrastructure
- IoT device provisioning and fleet management
- Subscriber management and usage billing
- Coverage analysis and network monitoring
- MQTT/CoAP/LoRaWAN device protocols
- Telecom BSS/OSS systems

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/telecom-hub-sdk/network` | NetworkFacade | Nodes, coverage, bandwidth |
| `@agencyos/telecom-hub-sdk/iot` | IoTFacade | Devices, fleets, telemetry |
| `@agencyos/telecom-hub-sdk/subscriber` | SubscriberFacade | Plans, usage, billing |

## Usage

```typescript
import { createIoTHub, createSubscriberManager } from '@agencyos/telecom-hub-sdk';
```

## Related Skills

- `telecom-iot` — Telecom & IoT patterns
- `telecom-iot-agent` — Telecom AI workflows
