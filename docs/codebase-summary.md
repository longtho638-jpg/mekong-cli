# Codebase Summary

**Generated:** 2026-02-06
**Based on:** `repomix-output.xml` compaction and current file structure.

## 1. Project Overview
**Name:** Mekong CLI / AgencyOS
**Description:** A Robot-as-a-Service (RaaS) platform and CLI tool for scaffolding and managing AI agencies. It uses a Hub-and-Spoke architecture with a central engine, asynchronous workers, and a developer-focused CLI.

## 2. Directory Structure

### 📂 Apps (`/apps`)
Applications deployed as services or user interfaces.

- **`agencyos-landing`**: Next.js 14 web application for the AgencyOS landing page and client platform.
- **`engine`**: Node.js/Fastify backend API acting as the central hub for job management, validation, and persistence (PostgreSQL).
- **`worker`**: Node.js/BullMQ worker service for executing asynchronous tasks (the "Spoke").
- **`raas-gateway`**: Cloudflare Workers entry point for API traffic, handling auth and rate limiting.
- **`sophia-ai-factory`**: AI Video Factory agent application.
- **`sophia-proposal`**: Proposal generation agent.
- **`sophia-video-bot`**: Video bot agent.
- **`84tea`**: F&B POS application (vertical integration).

### 📦 Packages (`/packages`)
Shared libraries and SDKs used across apps and the CLI.

- **`vibe-dev`**: Core development tools, CLI entry point (`mekong`), and interactive wizards.
- **`vibe-analytics`**: Growth telemetry engine, DORA metrics, and GitHub GraphQL integration.
- **`vibe-agents`**: Base classes and utilities for autonomous agents.
- **`vibe-ui`**: Shared UI components (likely React/Tailwind).
- **`vibe-marketing`**: Marketing automation tools.
- **`vibe-revenue`**: Revenue tracking and monetization logic.
- **`vibe-ops`**: Operational tools.
- **`shared`**: Common utilities and types.

### 📄 Documentation (`/docs`)
Project documentation, roadmaps, and architectural guides.

- **`MASTER_PRD.md`**: Single Source of Truth for the project requirements and architecture.
- **`MASTER_ROADMAP_1M.md`**: Revenue strategy and execution phases.
- **`system-architecture.md`**: Technical architecture (Hub-and-Spoke), data models, and deployment strategies.
- **`project-changelog.md`**: Record of changes and version history.
- **`development-rules.md`**: Coding standards and workflows.

### 🧠 Knowledge Base (`.gemini/antigravity/knowledge`)
Curated AGI knowledge items for the Sage Agent's reasoning engine.

- **`ethics_moral_reasoning.md`**: Frameworks for AI alignment and ethics.
- **`self_correction_error_detection.md`**: Mechanisms for RLAIF and autonomous oversight.
- **`meta_learning_adaptive_strategies.md`**: MAML, Hypernetworks, and continuous learning.
- **`consciousness_self_awareness.md`**: Global Workspace Theory and Attention Schema Theory.
- **`causal_reasoning_counterfactuals.md`**: Structural Causal Models and Do-calculus.
- **`emotional_intelligence_empathy.md`**: Affective computing and Theory of Mind.
- **`long_term_alignment_value_learning.md`**: Superalignment and Direct Preference Optimization.
- **`robustness_adversarial_resistance.md`**: Adversarial training and formal verification.
- **`interpretability_explainable_ai.md`**: Mechanistic interpretability and Sparse Autoencoders.
- **`resource_management_efficiency.md`**: BitNet (1-bit LLMs) and State Space Models (Mamba).

### 🛠️ Infrastructure
- **Root Configuration**: `package.json` (Monorepo), `turbo.json` (Build system).
- **Database**:
    - **PostgreSQL**: Production database (schema defined in `apps/engine/prisma` or similar).
    - **SQLite**: Local development database.
    - **Redis**: Job queue backing (BullMQ).

## 3. Tech Stack
- **Languages**: TypeScript (Primary), Python (CLI/Scripts).
- **Frameworks**: Next.js (Web), Fastify (API), Cloudflare Workers (Edge).
- **Runtime**: Node.js, Bun (potentially for scripts), Python 3.x.
- **Data**: PostgreSQL (Prisma ORM), Redis (BullMQ), SQLite (Local Dev).
- **Tools**: TurboRepo, Docker, Repomix.

## 4. Key Workflows
- **Development**: `npm run dev` starts local services (API + Frontend) with SQLite.
- **Deployment**: Dockerized services for Cloud Run (Engine/Worker), Vercel (Web), Cloudflare (Gateway).
- **CLI**: `mekong` command for scaffolding, managing recipes, and interacting with the RaaS platform.
