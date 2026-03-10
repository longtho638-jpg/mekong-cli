---
name: education-hub-sdk
description: Unified education SDK — LMS, assessment, student analytics. Use for learning platforms, course management, grading systems, student progress tracking.
license: MIT
version: 1.0.0
---

# Education Hub SDK Skill

Build learning platforms, assessment systems, and student analytics with unified education facades.

## When to Use

- LMS (Learning Management System) setup
- Course creation and curriculum management
- Assessment and grading pipelines
- Student progress tracking and analytics
- Adaptive learning paths
- EdTech platform architecture

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/education-hub-sdk/lms` | LMSFacade | Course management, enrollment |
| `@agencyos/education-hub-sdk/assessment` | AssessmentFacade | Quizzes, grading, rubrics |
| `@agencyos/education-hub-sdk/student-analytics` | StudentAnalyticsFacade | Progress, completion, engagement |

## Usage

```typescript
import { LMSFacade, AssessmentFacade, StudentAnalyticsFacade } from '@agencyos/education-hub-sdk';
```

## Related Skills

- `edtech` — EdTech platform patterns
- `education-agent` — AI-powered tutoring agent
- `coaching-mentor-agent` — Mentorship workflows
