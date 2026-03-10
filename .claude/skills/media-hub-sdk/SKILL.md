---
name: media-hub-sdk
description: Unified media SDK — content verification, synthetic media detection, media trust. Use for content authenticity, deepfake detection, media provenance tracking.
license: MIT
version: 1.0.0
---

# Media Hub SDK Skill

Build content verification, synthetic media detection, and media trust systems with unified media facades.

## When to Use

- Content authenticity verification
- Deepfake and synthetic media detection
- Media provenance tracking (C2PA/CAI standards)
- Trust scoring for user-generated content
- Content moderation pipelines
- Digital watermarking

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/media-hub-sdk/content-verification` | ContentVerificationFacade | Authenticity, provenance |
| `@agencyos/media-hub-sdk/synthetic-media` | SyntheticMediaFacade | Detection, classification |
| `@agencyos/media-hub-sdk/media-trust` | MediaTrustFacade | Trust scores, reputation |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-media-trust` | Media trust engine |

## Usage

```typescript
import { ContentVerificationFacade, SyntheticMediaFacade, MediaTrustFacade } from '@agencyos/media-hub-sdk';
```

## Related Skills

- `synthetic-media-trust` — Synthetic media patterns
- `trust-safety-content-moderation` — Content moderation
- `media-agent` — Media AI workflows
- `video-understanding` — Video analysis
