---
name: edtech
description: LMS platforms, course creation, AI tutoring, assessment, proctoring, learning analytics, credentials, xAPI/LTI standards. Use for education platforms, e-learning, training systems.
license: MIT
version: 1.0.0
---

# EdTech (Education Technology) Skill

Build learning management systems, course platforms, AI-powered tutoring, assessment tools, and education applications with modern LTI/xAPI standards.

## When to Use

- LMS platform integration (Canvas, Moodle)
- Course creation and hosting platform development
- AI tutoring and adaptive learning features
- Assessment, quizzing, and proctoring systems
- Learning analytics and student engagement
- Digital credentials and certification
- Video-based learning platforms
- Student gamification and engagement tools
- LTI 1.3 and xAPI integration
- Corporate training and L&D platforms

## Tool Selection

| Need | Choose |
|------|--------|
| LMS (enterprise) | Canvas LMS (LTI 1.3 Advantage, REST API) |
| LMS (open-source) | Moodle 4.5+ (AI subsystem, GPT-4 native) |
| Course hosting (creator) | Teachable ($99+), Thinkific ($79+) |
| Course hosting (all-in-one) | Kajabi ($119+, email + landing pages) |
| AI tutoring | Khanmigo (GPT-4 Omni), Disco AI |
| Assessment/proctoring | ProctorU (2M+ exams/yr), Turnitin |
| Video learning | Kaltura (API-first), Vimeo OTT |
| Student engagement | Kahoot! (gamified), Nearpod (interactive) |
| Learning analytics | xAPI/TinCan (IEEE standard), Clever (25M+ students) |
| Digital credentials | Credly (badges), Accredible (certificates) |
| Roster/SSO | Clever (OAuth 2.0, US K-12 standard) |

## EdTech Architecture

```
Learners / Instructors
    ↓ (Browser / Mobile / LTI)
┌────────────────────────────────────────────┐
│  Learning Platform                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Course   │  │ Assess-  │  │ Video    │ │
│  │ Content  │  │ ment     │  │ Player   │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌────────────────────────────────────────────┐
│  Integration Layer (LTI 1.3 + xAPI)        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ LTI      │  │ xAPI     │  │ Roster   │ │
│  │ Launch   │  │ Tracking │  │ Sync     │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Learning │  │ AI       │  │ Creden-  │
│ Record   │  │ Tutor    │  │ tials    │
│ Store    │  │ Engine   │  │ (Credly) │
└──────────┘  └──────────┘  └──────────┘
```

## xAPI Statement Pattern

```python
# xAPI (TinCan) learning experience tracking
import json, requests

LRS_URL = "https://lrs.example.com/xapi/statements"
LRS_AUTH = ("key", "secret")

statement = {
    "actor": {
        "mbox": "mailto:student@example.com",
        "name": "Jane Doe"
    },
    "verb": {
        "id": "http://adlnet.gov/expapi/verbs/completed",
        "display": {"en-US": "completed"}
    },
    "object": {
        "id": "https://example.com/courses/python-101/module-3",
        "definition": {
            "name": {"en-US": "Python Basics Module 3"},
            "type": "http://adlnet.gov/expapi/activities/module"
        }
    },
    "result": {
        "score": {"scaled": 0.92, "raw": 92, "max": 100},
        "completion": True,
        "duration": "PT45M"  # ISO 8601 duration
    }
}

requests.post(LRS_URL, json=statement, auth=LRS_AUTH,
              headers={"X-Experience-API-Version": "1.0.3"})
```

## Education Standards

| Standard | Purpose | Status 2026 |
|----------|---------|-------------|
| LTI 1.3 Advantage | Tool integration (grade sync, deep linking) | Production standard |
| xAPI (TinCan) | Learning experience tracking | IEEE 9274.1.1-2023 approved, replacing SCORM |
| SCORM 2004 | Content packaging | Legacy, declining adoption |
| cmi5 | xAPI + LMS launch profile | Growing |
| QTI 3.0 | Question/test interop | IMS standard |
| Open Badges 3.0 | Digital credential format | W3C Verifiable Credentials aligned |

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Course Completion | Completed / Enrolled | > 60% |
| Assessment Pass Rate | Passed / Attempted | > 75% |
| Learner Engagement | Active time / Total time | > 70% |
| Content Utilization | Accessed / Available content | > 50% |
| Credential Issuance | Issued / Eligible learners | > 80% |
| NPS (Learner) | Promoters - Detractors | > 40 |
| Time-to-Competency | Enrollment → Certification avg | Decreasing |
| Knowledge Retention | Post-test score at 30/90 days | > 70% |

## References

- Canvas API: https://canvas.instructure.com/doc/api
- Moodle Dev: https://moodledev.io
- xAPI Spec: https://github.com/adlnet/xAPI-Spec
- LTI 1.3: https://www.imsglobal.org/spec/lti
- Credly: https://info.credly.com/developers
- Kaltura: https://developer.kaltura.com
- Clever: https://dev.clever.com
- Kahoot: https://kahoot.com/business
