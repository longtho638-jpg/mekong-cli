---
name: ai-hub-sdk
description: Unified AI SDK — safety guardrails, agent orchestration, video intelligence, media trust, digital twins. Use for AI safety, multi-agent systems, content verification.
license: MIT
version: 1.0.0
---

# AI Hub SDK Skill

Build AI-powered systems with unified safety, agent orchestration, and media intelligence facades.

## When to Use

- AI safety guardrails and content moderation
- Multi-agent orchestration and coordination
- Video intelligence and content analysis
- Deepfake detection and media verification
- Digital twin modeling and simulation
- Red teaming and alignment testing

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/ai-hub-sdk/safety` | SafetyFacade | Guardrails, moderation |
| `@agencyos/ai-hub-sdk/agents` | AgentsFacade | Orchestration, tools, memory |
| `@agencyos/ai-hub-sdk/media` | MediaFacade | Video intel, trust verification |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-ai-safety` | Safety checks, guardrails |
| `@agencyos/vibe-agents` | Agent framework |
| `@agencyos/vibe-video-intel` | Video analysis |
| `@agencyos/vibe-media-trust` | Content authenticity |
| `@agencyos/vibe-digital-twin` | Digital twin modeling |
