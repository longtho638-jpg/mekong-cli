# EdTech Platforms & APIs 2025-2026 Research Report

**Date:** 2026-03-01 | **Status:** Complete | **Focus:** Developer-Integrable Platforms

---

## Executive Summary

EdTech ecosystem expanded significantly in 2025-2026. Canvas leads LMS market with LTI 1.3 standard. Moodle dominates open-source with AI subsystem (4.5+). Course platforms (Teachable/Thinkific) matured with robust APIs. AI tutoring emerged as differentiator (Khanmigo, Duolingo AI). xAPI/TinCan standard gaining adoption over legacy SCORM. Blockchain credentials (Credly, Accredible) commoditized. Video platforms diversified (Loom, Vimeo, Kaltura).

---

## 1. LMS PLATFORMS

| Platform | Key Developer Feature | API/SDK | Status 2026 |
|----------|----------------------|---------|-----------|
| **Canvas LMS** | LTI 1.3 Advantage, xAPI support | REST API, LTI 1.3, Developer Keys | Mature. LTI launch validation, grade sync services |
| **Moodle 4.5+** | Open-source, AI Subsystem (GPT-4, Azure AI, Ollama, DeepSeek) | Web Services API, REST API, Data Manipulation API (dml), Form API | Stable. AI integration native. Hooks-based plugin system |
| **Teachable** | White-labeled courses, built-in payments | REST API (Grow plan +$159/mo), Zapier | Production. SSO, course delivery, student mgmt |
| **Thinkific** | Course authoring, learner profiles | REST API (Grow plan $199/mo) | Production. More integrations than Teachable, analytics included |
| **LearnWorlds** | Interactive content, certificates, payment processing | API available (plans vary) | Stable. xAPI/SCORM support |

---

## 2. COURSE CREATION & HOSTING

| Platform | Best For | Developer Integration | Pricing Note |
|----------|----------|----------------------|--------------|
| **Kajabi** | All-in-one (courses, email, landing pages) | Limited public API. Zapier focus | $119+/mo |
| **Podia** | Digital products (courses, bundles, email) | API available for integrations | $33+/mo |
| **LearnWorlds** | Interactive, multi-language courses | xAPI/SCORM, certificate integration | $99+/mo |
| **Teachable** | Creator-first, payments | REST API (higher tiers) | $99+/mo |
| **Thinkific** | Growth-focused, integrations | REST API, webhooks | $79+/mo |

---

## 3. ASSESSMENT & PROCTORING

| Platform | Capability | Integration | 2026 Note |
|----------|-----------|-------------|-----------|
| **ProctorU** | Live + automated proctoring, analytics | LMS integrations (Canvas, Moodle, Blackboard, D2L), API-driven | Standard-bearer. 2+ million exams/year |
| **Examity** | Live proctoring, post-test audit, AI-assisted | LMS integrations, native dashboard | 100% human audit guarantee |
| **Turnitin/ExamSoft** | Assessment management, academic integrity | Canvas, Moodle, Blackboard, D2L integrations | Focus shift: integrity + AI-aware |
| **Meazure Learning** | Secure exam delivery, reporting | ProctorU backend, API available | B2B test administration |

---

## 4. AI TUTORING & ADAPTIVE LEARNING

| Platform | Technology | Developer Access | 2026 Update |
|----------|----------|------------------|------------|
| **Khanmigo (Khan Academy)** | GPT-4 Omni, domain-specific pedagogy | No public API. Teachers: free (Microsoft partnership). Learners: $4/mo | Migrated from GPT-4 Turbo → GPT-4 Omni for better tutoring |
| **Duolingo AI (Max)** | GPT-4, LLM-generated content (148 new courses/year) | No public API. Paid subscription model | "AI-first" strategy. 148 courses created in 1 year using GenAI |
| **Disco AI** | GenAI content generation, adaptive learning | Built-in AI for course creation, assessment design | Next-gen LMS. Combines LMS + GenAI for branded academies |
| **Education Copilot** | LLM-powered lesson planning, content generation | Web interface, no API | Simplifies curriculum design |

---

## 5. VIDEO LEARNING PLATFORMS

| Platform | Key Feature | API/SDK | Developer Use Case |
|----------|------------|---------|-------------------|
| **Loom** | Screen recording, instant sharing, asynchronous | Limited API. Zapier integrations | Training, how-tos, quick documentation |
| **Vimeo OTT** | Enterprise video, advanced analytics, live streaming | Vimeo API (v3.4+), webhooks, custom apps | White-labeled video platform, DRM support |
| **Kaltura** | Enterprise LMS video, interactive features, API-first | Extensive REST API, JSON-RPC, Client libraries (JS, Python, PHP, Java) | Deep LMS integration, custom video apps, learning analytics |

---

## 6. STUDENT ENGAGEMENT & GAMIFICATION

| Platform | Mechanism | Developer Integration | 2026 Note |
|----------|-----------|----------------------|-----------|
| **Kahoot!** | Gamified quizzes, real-time leaderboards | API available (premium plans), Zapier | 1B+ players. Real-time engagement |
| **Nearpod** | Interactive lessons, VR support, real-time assessment | API available, LMS integrations, xAPI support | Rich media lessons + analytics |
| **Pear Deck** | Google Slides/Microsoft Office integration, live participation | Limited public API. Slack, Google Classroom integrations | Asynchronous + synchronous |
| **EdPuzzle** | Video with embedded questions, auto-grading | API for integrations, LMS compatible | Video-first engagement |

---

## 7. LEARNING ANALYTICS & INSIGHTS

| Platform | Analytics Focus | API | 2026 Position |
|----------|-----------------|-----|----------------|
| **LearnPlatform** | K-12 product database, LMS integrations, impact measurement | Research API, EdFacts data integration | Academic research + district-level |
| **Clever** | Roster data automation, teacher/student SSO, analytics | Roster API, Data API, OAuth 2.0 | 25M+ students. De facto data hub for US schools |
| **xAPI/TinCan (IEEE 9274.1.1-2023)** | Universal learning experience tracking (Learning Record Stores) | Open standard. 1000+ compatible tools | Replacing SCORM. Tracks offline/online/blended activities |
| **SCORM** | Legacy content packaging, LMS compliance | Deprecated in favor of xAPI | Still dominant but declining. 2026 shift accelerating |

---

## 8. CREDENTIALS & CERTIFICATION

| Platform | Feature | Developer API | Price/Integration |
|----------|---------|---------------|-------------------|
| **Credly** | Digital badges, verifiable credentials, blockchain option | REST API (enterprise), SAML SSO | Enterprise-grade. Credential network effects |
| **Accredible** | Digital certificates, blockchain verification, customization | REST API (requires additional fee), Zapier | ISO 27001. Stronger customization than Credly |
| **Certifier** | Credential issuing, verification, blockchain | API available | Emerging competitor. Blockchain-native |
| **Acreditta** | Digital credentials, learner portfolios, blockchain integration | API under development | Blockchain-first approach |

---

## 9. EDUCATION STANDARDS & APIs

| Standard | Purpose | Adoption 2026 | Use Case |
|----------|---------|---------------|----------|
| **xAPI (Tin Can)** | Track any learning activity (online, offline, blended) to Learning Record Store | Growing. IEEE 9274.1.1-2023 approved. 1000+ tools support | Replaces SCORM. Richest data capture. Unified analytics |
| **SCORM 1.2/2004** | Content packaging, LMS playback | Still dominant in K-12 but declining | Legacy. Limited to structured courses. No offline tracking |
| **LTI 1.3 (Canvas Advantage)** | Third-party tool integration into LMS | Standard in Canvas, Moodle, Blackboard, D2L | Deep LMS coupling. Grade passback, roster import |
| **Caliper (IMS)** | Learning analytics event stream (alternative to xAPI) | Niche. IMS-backed | Research institutions, some LMS vendors |
| **ONESITE (IMS)** | Single sign-on for education | Emerging | Streamlined SSO vs SAML for schools |

---

## 10. AI CONTENT GENERATION FOR EDUCATION

| Tool | Capability | Integration | 2026 Status |
|------|-----------|-------------|------------|
| **OpenAI/ChatGPT** | Content drafting, quiz generation, lesson planning | Web + API. Used by 1000s of EdTech apps | Baseline for most AI features. Copyright/attribution concerns |
| **Education Copilot** | Lesson plans, quiz design, rubrics, differentiation | Web interface (no API yet). Teacher-focused | Specialized for K-12. Growing adoption |
| **Duolingo's ML Pipeline** | Auto-generate courses from content. 148 new courses/year | Internal. Powers Duolingo Max subscription | Most productive GenAI deployment in EdTech |
| **Moodle AI Subsystem** | GPT-4, Azure OpenAI, Ollama local, DeepSeek integration | Via Moodle API (4.5+). Plugin-based | Open-source leaders. AI democratization |
| **Notebooklm (Google)** | Interactive notebooks from documents | Web interface, API under development | Powerful document summarization |

---

## Developer Integration Priorities (2026)

### Tier 1: Must-Use Standards
- **xAPI (TinCan)** — Universal. Tracks all activities. Replaces SCORM. 1000+ vendors support.
- **LTI 1.3** — Deep LMS integration. Canvas leads. Moodle, Blackboard, D2L support.
- **REST APIs** — Canvas, Moodle, Kaltura, Credly, Vimeo all have mature REST APIs.

### Tier 2: Growth Areas
- **AI Integration** — Moodle 4.5+ AI Subsystem. Duolingo's GenAI pipeline. OpenAI embeddings.
- **Blockchain Credentials** — Credly, Accredible, Certifier. Verifiable on-chain.
- **Video Analytics** — Kaltura, Vimeo. Engagement tracking beyond SCORM.

### Tier 3: Declining but Still Present
- **SCORM** — Legacy. 2026 shift away accelerating. Support < 2 years.
- **PayPal Payments** — EdTech switching to Stripe, Paddle, Polar.
- **Custom webhooks** — Zapier API aggregation preferred.

---

## Unresolved Questions

1. **xAPI Learning Record Store (LRS) standardization** — Which vendors (Rustici, Learning Locker, Watershed) will dominate? 2026 consolidation expected.
2. **Moodle AI Subsystem maturity** — How quickly will cost + reliability stabilize for production K-12 deployments?
3. **Blockchain credential adoption** — Will institutional verification shift to on-chain by 2026-2027?
4. **Khanmigo API roadmap** — Will Khan Academy eventually open Khanmigo API for integrations?
5. **Duolingo GenAI content licensing** — How will copyright/attribution be handled at scale (148 courses/year)?

---

## Sources

- [Canvas LMS LTI Documentation](https://documentation.instructure.com/doc/api/file.lti_launch_overview.html)
- [Moodle 4.5 AI Subsystem Guide](https://www.accipio.com/blog/moodle-lms-guide-2026/)
- [Khan Academy Khanmigo](https://www.khanmigo.ai/)
- [Duolingo AI-Powered Content Generation](https://blog.duolingo.com/large-language-model-duolingo-lessons/)
- [xAPI Standard (IEEE 9274.1.1-2023)](https://xapi.com/overview/)
- [Kaltura Video Platform API](https://developer.kaltura.com/)
- [OECD Digital Education Outlook 2026](https://digital-skills-jobs.europa.eu/en/latest/news/oecd-digital-education-outlook-2026-how-generative-ai-can-support-learning-when-used)
- [Credly API Documentation](https://developer.credly.com/)
- [ProctorU Platform](https://www.proctoru.com/)
- [Clever Roster API](https://developer.clever.com/)

