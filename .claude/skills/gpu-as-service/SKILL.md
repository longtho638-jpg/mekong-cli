# GPU-as-a-Service — 第二篇 作戰 (Operations & Resources)

> GPU orchestration, inference serving, model deployment, compute marketplace.

## Khi Nao Kich Hoat

Keywords: `GPU`, `inference serving`, `model serving`, `GPU cloud`, `compute marketplace`, `GPU orchestration`, `model deployment`, `vLLM`, `TGI`, `inference optimization`

## Vai Tro

1. **GPU Orchestration** — Multi-tenant GPU allocation, job scheduling, autoscaling
2. **Inference Serving** — High-throughput model serving, batching, quantization
3. **Cost Optimization** — Spot instance arbitrage, reserved capacity planning, usage metering
4. **Marketplace** — Compute reselling, GPU lending, federated inference networks

## Nghien Cuu (2026)

- 50%+ AI spend goes to inference — larger than training costs
- GPU-as-a-Service market projected $35-70B by 2030
- Telco edge compute emerging as GPU distribution network
- AI inference spending exceeds training for first time in 2026
- Key challenge: multi-tenant isolation, fair queuing, cost attribution

## Cong Cu & Frameworks

| Tool | Use Case | Type |
|------|----------|------|
| vLLM | High-throughput LLM serving | OSS |
| TGI (HuggingFace) | Text generation inference | OSS |
| Triton Inference Server | Multi-framework model serving | OSS (NVIDIA) |
| Ray Serve | Scalable inference serving | OSS |
| RunPod / Lambda Labs | GPU cloud provider | SaaS |
| SkyPilot | Multi-cloud GPU orchestration | OSS |

## Architecture Patterns

```
Model Registry
  → Quantization Pipeline (GPTQ/AWQ/GGUF)
  → Container Build (model + runtime)
  → GPU Scheduler (multi-tenant queue)
  → Autoscaler (demand-based GPU allocation)
  → Load Balancer (request routing)
  → Inference API (OpenAI-compatible)
  → Usage Metering + Billing
  → Cost Dashboard
```

## Implementation Checklist

- [ ] Model registry with versioned artifacts
- [ ] Quantization pipeline (FP16, INT8, INT4)
- [ ] GPU job scheduler with priority queuing
- [ ] Autoscaling based on request latency/throughput
- [ ] OpenAI-compatible inference API
- [ ] Usage metering and cost attribution
- [ ] Multi-tenant isolation (GPU memory, compute)
- [ ] Spot instance failover strategy

## Lien Ket

- Skills: `ai-ops-mlops`, `llmops-ai-observability`, `docker-expert`, `aws-serverless`
- Sources: [AI Infrastructure Market](https://www.coherentmarketinsights.com/industry-reports/ai-infrastructure-market)
