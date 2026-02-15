## 🌊 Mekong CLI — RaaS Agency Operating System

<div align="center">

![v2.2.0](https://img.shields.io/badge/v2.2.0-stable-22c55e?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Architecture](https://img.shields.io/badge/Architecture-Binh_Pháp-ec4899?style=for-the-badge&logo=military-tech&logoColor=white)

**The Revenue-as-a-Service (RaaS) Foundation for Autonomous AI Agencies.**
*Transforming service models into high-precision execution engines.*

[🚀 Quick Start](#-quick-start) • [📦 Architecture](#-architecture) • [💎 RaaS Foundation](#-raas-foundation) • [🎯 Features](#-features) • [🤝 Contributing](#-contributing) • [🇻🇳 Tiếng Việt](README.vi.md)

</div>

---

## 📖 Introduction

**Mekong CLI** is the central nervous system for **Revenue-as-a-Service (RaaS)** agencies. Inspired by **The Art of War (孫子兵法)**, it orchestrates specialized AI agents to plan, execute, and verify complex engineering and business tasks with 100% precision.

It bridges the gap between high-level strategic goals and low-level code execution, ensuring that every "mission" is completed according to strict quality gates.

## 🎯 Key Features

### 🧠 Autonomous Execution Engine (PEV)
The core **Plan-Execute-Verify** workflow ensures systematic task handling:
- **Plan**: Deep multi-step decomposition using reasoning models (Opus 4.5, Gemini 2.0).
- **Execute**: Multi-mode execution (Shell, API, LLM) with self-healing capabilities.
- **Verify**: Strict **Binh Phap Quality Gates** (Type safety, No tech debt, Security audit).

### 🦞 Tôm Hùm (OpenClaw Daemon)
The autonomous orchestrator that keeps your agency running 24/7:
- **Autonomous Dispatch**: Watches `tasks/` directory and routes missions to specialized edge nodes.
- **Auto-CTO**: Proactively cleans code, fixes types, and audits security during idle time.
- **Hardware Awareness**: M1 thermal protection and RAM optimization for high-density edge deployments.

### ⚡ Antigravity Proxy
A unified LLM gateway (`port 11436`) for cost-effective intelligence:
- **Load Balancing**: Distributes load across Ollama, OpenRouter, and direct providers.
- **Failover**: Automatic model switching (e.g., Sonnet to Gemini) during quota limits.
- **Optimization**: Smart routing based on task complexity and budget.

---

## 📦 Architecture

```mermaid
graph TD
    User[User / Webhook] -->|Mission File| Inbox[tasks/ inbox]
    Inbox --> TomHum[🦞 Tôm Hùm Daemon]

    subgraph "Hub (Orchestration)"
        TomHum -->|Dispatch| Brain[CC CLI Brain]
        Brain -->|PEV Cycle| Engine[Mekong Engine]
    end

    subgraph "Execution Layer"
        Engine -->|Edit Code| Files[Source Code]
        Engine -->|Verify| Test[Pytest / Vitest]
        Engine -->|Deploy| CI[GitHub Actions]
    end

    subgraph "Intelligence"
        Engine -->|Proxy :11436| Antigravity[Antigravity Proxy]
        Antigravity --> Models[Claude / Gemini / DeepSeek]
    end

    subgraph "RaaS Ecosystem"
        Engine --> App1[Sophia AI Factory]
        Engine --> App2[84tea F&B]
        Engine --> App3[Apex OS]
    end
```

---

## 💎 RaaS Foundation

Mekong CLI is the reference implementation of the **Revenue-as-a-Service (RaaS)** model, where value is delivered via autonomous missions.

### Tiered Intelligence Model
| Tier | Deployment | Intelligence | Best For |
|------|------------|--------------|----------|
| **Free** | Local Edge | Ollama / Local Models | Developers & OSS |
| **Agency** | Managed Nodes | Antigravity Proxy (Managed) | AI Agencies & Startups |
| **Enterprise** | Dedicated Swarm | Fine-tuned / Private Vaults | Corporations |

Detailed tier breakdown can be found in [RaaS Foundation Docs](./docs/raas-foundation.md).

---

## 🚀 Quick Start

### 1. Prerequisites
- **Python**: 3.11+
- **Node.js**: 20+
- **pnpm**: 8+

### 2. Installation
```bash
git clone https://github.com/longtho638-jpg/mekong-cli.git
cd mekong-cli
pnpm install
pip install -r requirements.txt
cp .env.example .env
```

### 3. Launch the General (Tôm Hùm)
```bash
cd apps/openclaw-worker
npm run start
```

### 4. Deploy your first Mission
Create a file `tasks/mission_hello.txt`:
```text
- Project: mekong-cli
- Description: Say hello and check system health
- Instructions:
  1. Print "Mekong CLI Ready"
  2. Run unit tests to verify installation
```

---

## 🤝 Contributing

We follow **Binh Phap Standards**.
1. Read the [Code Standards](./docs/code-standards.md).
2. Use the `/cook` command for implementations.
3. Ensure **GREEN PRODUCTION** (Điều 49) before reporting success.

---

<div align="center">
**Mekong CLI** © 2026 Binh Phap Venture Studio.
*"Speed is the essence of war."*
</div>
