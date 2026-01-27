# AgencyOS - Product Development Requirements (PDR)

**Version:** 5.1.1
**Last Updated:** 2026-01-25
**Status:** Production Ready

## Executive Summary

AgencyOS is an AI-native operating system for solopreneurs and agencies, built on **Binh Pháp (Art of War)** principles. It provides 24+ AI agents, 14 MCP servers, and 48+ reusable skills to automate agency operations.

## Core Features

### 1. AI Workforce
- 24 specialized agents (Planner, Coder, Marketer, Strategist)
- Multi-agent orchestration via MCP servers
- Context-aware task delegation

### 2. Revenue Engine
- Integrated PayPal/Stripe payments
- Subscription management
- Vietnam tax compliance (0.5% simplified, 20% standard+VAT)
- License generation (`AGY-{tenant}-{timestamp}-{checksum}`)

### 3. Development Tools
- CLI commands (cc revenue, cc deploy, cc finance)
- Frontend: Next.js 15 + Material Design 3
- Backend: FastAPI + Supabase + PostgreSQL

### 4. Growth Infrastructure
- Content generation (marketing, social, email)
- Lead management
- Affiliate program support

## Technical Architecture

### Frontend
- **Dashboard:** apps/dashboard (Next.js 15, MD3, React 19)
- **Docs:** apps/docs (Astro static site)
- **Web:** apps/web (Marketing landing page)

### Backend
- **API:** backend/api (FastAPI, Python 3.11+)
- **Database:** Supabase (PostgreSQL)
- **Cache:** Redis (optional)

### Deployment
- **Frontend:** Vercel (auto-deploy from main branch)
- **Backend:** Google Cloud Run (containerized)
- **MCP Servers:** Cloud Run (separate services)

## Target Users

1. **Solo Founders:** $395/year (Solo plan)
2. **Small Agencies:** $995/year (Team plan, 5 users)
3. **Enterprise Agencies:** Custom pricing (unlimited users)

## Success Metrics

- **MRR Target:** $10K by Q2 2026
- **ARR Target:** $120K by Q4 2026
- **Users:** 100+ active licenses
- **Response Time:** API &lt;200ms, Dashboard &lt;1s load

## Roadmap

### Q1 2026 (Current)
- ✅ Payment integration (PayPal)
- ✅ License generation
- ✅ Dashboard polish
- 🚧 MCP server deployment

### Q2 2026
- Stripe subscriptions
- Affiliate management
- A/B testing framework
- Mobile app (React Native)

### Q3 2026
- AI-powered proposals
- Contract generation
- CRM integration (HubSpot, Salesforce)

