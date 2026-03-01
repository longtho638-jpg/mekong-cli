# Ambient Computing — 第六篇 虛實 (Weaknesses & Strengths)

> Edge inference, contextual sensing, device orchestration, invisible UX.

## Khi Nao Kich Hoat

Keywords: `ambient computing`, `ubiquitous computing`, `edge inference`, `smart environment`, `contextual sensing`, `device orchestration`, `ambient intelligence`, `invisible UX`, `IoT edge`

## Vai Tro

1. **Edge AI Pipeline** — On-device inference, model optimization, real-time sensor fusion
2. **Device Orchestration** — Multi-device coordination, state sync, contextual handoff
3. **Contextual Sensing** — Presence detection, activity recognition, environmental awareness
4. **Ambient UX** — Zero-UI interactions, proactive notifications, predictive actions

## Nghien Cuu (2026)

- IDC: 60% households in developed nations feature ambient tech by 2026
- 50%+ user-device interactions occur in ambient settings (2025+)
- 6 enabling technologies: ambient intelligence, contextual sensing, natural interfaces, ubiquitous connectivity, adaptive displays, edge silicon
- Privacy challenge: continuous sensing (cameras, microphones, location, biometrics) requires consent frameworks
- AI backbone processes inputs, learns behavior, predicts needs across smart ecosystem

## Cong Cu & Frameworks

| Tool | Use Case | Type |
|------|----------|------|
| TensorFlow Lite | On-device ML inference | OSS SDK |
| ONNX Runtime | Cross-platform edge models | OSS SDK |
| Matter (CSA) | Smart home interoperability | Protocol |
| Home Assistant | Home automation orchestration | OSS Platform |
| AWS IoT Greengrass | Edge compute + cloud sync | Cloud SDK |
| Apple HomeKit | Device coordination framework | SDK |

## Architecture Patterns

```
Sensor Layer (cameras, mics, motion, temp)
  → Edge Inference (TFLite/ONNX)
  → Context Engine (activity recognition)
  → State Manager (cross-device sync)
  → Action Orchestrator (proactive responses)
  → Privacy Layer (local-first, opt-in)
  → Cloud Sync (aggregation, model updates)
```

## Implementation Checklist

- [ ] Edge ML inference pipeline (TFLite/ONNX)
- [ ] Sensor data fusion engine
- [ ] Activity/presence recognition models
- [ ] Device state synchronization protocol
- [ ] Contextual action rules engine
- [ ] Privacy-first data handling (local processing)
- [ ] Cloud sync for model updates and analytics

## Lien Ket

- Skills: `edge-ai-tinyml`, `telecom-iot`, `physical-ai-robotics`, `spatial-computing`
- Sources: [Ambient Computing Report 2026](https://www.globenewswire.com), [IDC Forecast](https://blog.exascale-ai.in/ambient-computing-meaning/)
