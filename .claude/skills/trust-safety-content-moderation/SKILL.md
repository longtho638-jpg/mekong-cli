# Trust & Safety — AI Content Moderation

Build content moderation, fraud detection, and platform safety systems. $12B market by 2027, 15% CAGR.

## When to Use
- Implementing AI-powered content moderation for UGC platforms
- Building fraud detection pipelines for marketplaces
- Creating trust scores and reputation systems
- Handling CSAM detection, hate speech filtering, misinformation

## Key Concepts
| Term | Meaning |
|------|---------|
| T&S | Trust & Safety — platform integrity operations |
| UGC | User-Generated Content — text, images, video, audio |
| CSAM | Child Sexual Abuse Material — mandatory detection |
| Toxicity | Hate speech, harassment, threats, self-harm content |
| Appeal | User's request to reverse moderation decision |
| Queue | Prioritized list of content awaiting human review |

## Core Modules
```
Content Classification
  ├── Text toxicity detection (Perspective API, OpenAI Mod)
  ├── Image/video classification (nudity, violence, CSAM)
  ├── Audio transcription + analysis
  └── Multi-modal context understanding

Policy Engine
  ├── Rule-based policy definitions
  ├── Graduated enforcement (warn → restrict → ban)
  ├── Geo-specific policy variants
  └── Policy versioning + audit trail

Review Pipeline
  ├── Automated triage + priority scoring
  ├── Human review queues (FIFO, priority)
  ├── Reviewer tools + annotation UI
  └── Quality assurance (inter-rater reliability)

User Safety
  ├── Account reputation scoring
  ├── Rate limiting + abuse detection
  ├── Appeals workflow
  └── Transparency reporting
```

## Key Integrations
| Category | Services |
|----------|---------|
| AI Moderation | OpenAI Moderation, Perspective API, Hive Moderation |
| Image Safety | PhotoDNA (CSAM), AWS Rekognition, Google Vision AI |
| Fraud | Sift, Sardine, Castle |
| Identity | Persona, Jumio, Onfido |
| Reporting | NCMEC CyberTipline, IWF |

## Implementation Patterns
```typescript
interface ModerationConfig {
  providers: ('openai' | 'perspective' | 'hive' | 'custom')[];
  autoActionThreshold: number; // 0-1 confidence for auto-removal
  humanReviewThreshold: number; // below this → auto-approve
  policies: PolicyRule[];
}

interface ModerationResult {
  contentId: string;
  categories: { name: string; score: number; flagged: boolean }[];
  action: 'approve' | 'flag' | 'remove' | 'escalate';
  confidence: number;
  reviewRequired: boolean;
}

interface AppealRequest {
  contentId: string;
  userId: string;
  reason: string;
  status: 'pending' | 'upheld' | 'overturned';
  reviewedBy?: string;
}
```

## SDK
`@agencyos/vibe-trust-safety` — content classification, policy engine, review queues, appeals workflow
