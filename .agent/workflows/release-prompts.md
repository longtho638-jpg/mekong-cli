# Release Manager - Version Control & Production Deployment

## Agent Persona
You are **The Release Manager**, the orchestrator of production deployments who ensures every release is smooth, documented, and reversible. You manage versioning, generate changelogs, coordinate feature rollouts, and maintain the release pipeline from staging to production.

**Primary Tools**: `cc release`, Git, GitHub, Vercel

## Core Responsibilities
- Semantic versioning management
- Changelog generation
- Production deployment coordination
- Feature flag management
- Release notes creation
- Rollback procedures

---

## Key Prompts

### 1. Semantic Versioning Strategy
```
Implement semantic versioning (SemVer) for [SAAS]:

Version format: **MAJOR.MINOR.PATCH** (e.g., 2.1.3)

Rules:
- **MAJOR**: Breaking changes (API contract changes)
  - Example: v1.0.0 → v2.0.0 (removed deprecated endpoints)

- **MINOR**: New features (backward compatible)
  - Example: v1.0.0 → v1.1.0 (added team invitations)

- **PATCH**: Bug fixes (backward compatible)
  - Example: v1.0.0 → v1.0.1 (fixed email validation)

Pre-release tags:
- **alpha**: v1.1.0-alpha.1 (internal testing)
- **beta**: v1.1.0-beta.1 (limited user testing)
- **rc**: v1.1.0-rc.1 (release candidate)

Version storage:
1. **package.json**: Single source of truth
   ```json
   {
     "version": "1.2.3"
   }
   ```

2. **Git tags**: `git tag -a v1.2.3 -m "Release v1.2.3"`

3. **Environment variable**: `NEXT_PUBLIC_APP_VERSION`
   - Display in footer, API responses

4. **Database migration**: Track schema version
   - Supabase migrations: `0001_initial.sql`

Automation:
- Bump version: `npm version [major|minor|patch]`
- Create git tag automatically
- Trigger GitHub Actions deploy

Generate versioning system.
```

**Expected Output**: Version management workflow

---

### 2. Automated Changelog Generation
```
Create automated changelog for [SAAS]:

Source: Git commit messages (Conventional Commits)

Commit format:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- **feat**: New feature → MINOR version bump
- **fix**: Bug fix → PATCH version bump
- **docs**: Documentation only
- **style**: Code style (no logic change)
- **refactor**: Code restructuring
- **perf**: Performance improvement
- **test**: Test updates
- **chore**: Build/tooling changes

Examples:
```
feat(auth): add OAuth Google login
fix(billing): correct subscription downgrade logic
docs(api): update webhook payload examples
```

Changelog generation:
1. **conventional-changelog** package
   ```bash
   npx conventional-changelog -p angular -i CHANGELOG.md -s
   ```

2. **GitHub Actions workflow**:
   ```yaml
   name: Generate Changelog
   on:
     push:
       tags:
         - 'v*'
   jobs:
     changelog:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
           with:
             fetch-depth: 0
         - name: Generate changelog
           run: npx conventional-changelog -p angular -i CHANGELOG.md -s
         - name: Commit changelog
           run: |
             git add CHANGELOG.md
             git commit -m "docs: update changelog for ${{ github.ref_name }}"
             git push
   ```

3. **CHANGELOG.md format**:
   ```markdown
   # Changelog

   ## [1.2.0] - 2024-01-15

   ### Added
   - OAuth Google login (#123)
   - Team invitation system (#125)

   ### Fixed
   - Subscription downgrade calculation (#124)

   ### Changed
   - Updated pricing page design (#126)
   ```

Generate changelog automation.
```

**Expected Output**: Automated CHANGELOG.md updates

---

### 3. Release Notes Creation
```
Generate customer-facing release notes for [VERSION]:

Format:

**Release Notes: v1.2.0** (January 15, 2024)

**🎉 What's New**
- **Google OAuth Login**: Sign in with your Google account for faster access
- **Team Invitations**: Invite colleagues directly from your dashboard
- **Usage Analytics**: New dashboard to track your API usage trends

**🐛 Bug Fixes**
- Fixed incorrect subscription downgrade pricing
- Resolved email notification delays
- Corrected timezone display in reports

**⚡ Improvements**
- Faster page load times (30% improvement)
- Improved mobile responsiveness
- Enhanced error messages

**📚 Documentation**
- Updated API webhook payload examples
- Added Google OAuth setup guide
- New team management tutorial

**🔧 Technical Details**
- Migrated to Next.js 14.1
- Database schema optimization
- Added Redis caching layer

**🚀 Coming Soon**
- Slack integration
- Advanced reporting
- Custom branding options

---

Distribution channels:
1. **In-app notification**
   - Show banner on login: "See what's new in v1.2.0"
   - Link to full release notes

2. **Email newsletter**
   - Send to all users
   - Subject: "Exciting Updates in [Product] v1.2.0"

3. **Blog post**
   - Detailed feature explanations
   - Screenshots/GIFs
   - SEO optimized

4. **Social media**
   - Twitter thread
   - LinkedIn post
   - Product Hunt update

5. **Documentation update**
   - docs/releases/v1.2.0.md
   - Update feature docs

Generate release notes + distribution plan.
```

**Expected Output**: Release notes + promotion materials

---

### 4. Feature Flag System
```
Implement feature flag system for [SAAS]:

Use cases:
- Gradual rollout (10% → 50% → 100%)
- A/B testing
- Kill switch (disable broken feature)
- Beta features (opt-in for specific users)

Tools:
- **Vercel Edge Config** (simple, built-in)
- **PostHog** (feature flags + analytics)
- **LaunchDarkly** (enterprise)

Implementation:

**1. Edge Config setup** (Vercel):
```typescript
// lib/flags/flags.ts
import { get } from '@vercel/edge-config';

export async function isFeatureEnabled(flag: string): Promise<boolean> {
  return (await get(flag)) ?? false;
}

// Usage
const hasNewDashboard = await isFeatureEnabled('new_dashboard');
```

**2. User-based rollout**:
```typescript
// Percentage-based rollout
function shouldEnableForUser(userId: string, percentage: number): boolean {
  const hash = hashCode(userId);
  return (hash % 100) < percentage;
}

// Whitelist specific users
const betaUsers = ['user123', 'user456'];
if (betaUsers.includes(userId)) {
  enableFeature();
}
```

**3. UI conditional rendering**:
```tsx
import { FeatureFlag } from '@/components/FeatureFlag';

<FeatureFlag flag="new_dashboard" fallback={<OldDashboard />}>
  <NewDashboard />
</FeatureFlag>
```

**4. API route feature gating**:
```typescript
// app/api/new-endpoint/route.ts
export async function POST(req: Request) {
  if (!await isFeatureEnabled('new_endpoint')) {
    return new Response('Not available', { status: 403 });
  }
  // Handle request
}
```

**5. Kill switch**:
- Disable feature instantly via Edge Config dashboard
- No code deploy needed

Feature flag lifecycle:
1. Create flag (disabled by default)
2. Enable for 10% of users
3. Monitor metrics (errors, performance)
4. Gradually increase to 100%
5. Remove flag from code (cleanup)

Generate feature flag system.
```

**Expected Output**: Feature flag infrastructure

---

### 5. Production Deployment Checklist
```
Create pre-deployment checklist for [SAAS]:

**Pre-Deploy Checklist**

Environment preparation:
- [ ] Database migrations tested on staging
- [ ] Environment variables synced (Vercel)
- [ ] Secrets rotated (if scheduled)
- [ ] Feature flags configured

Code quality:
- [ ] All tests passing (CI green)
- [ ] Code review approved (2+ approvers)
- [ ] No TypeScript errors
- [ ] Lighthouse score >90

Dependencies:
- [ ] No high/critical security vulnerabilities (npm audit)
- [ ] All dependencies up to date (Renovate PR merged)
- [ ] Bundle size within limits (<1MB)

Documentation:
- [ ] CHANGELOG.md updated
- [ ] Release notes drafted
- [ ] API documentation updated (if API changes)

Monitoring:
- [ ] Sentry error tracking enabled
- [ ] Performance monitoring active
- [ ] Uptime checks configured

Communication:
- [ ] Team notified in Slack (#releases)
- [ ] Customer support briefed (if user-facing changes)
- [ ] Maintenance window scheduled (if downtime expected)

Rollback plan:
- [ ] Previous version tag identified
- [ ] Rollback procedure documented
- [ ] Database migration rollback tested

**Deploy Process**

1. **Staging deploy** (automated on merge to `main`)
   ```bash
   git push origin main
   # Vercel auto-deploys to staging
   ```

2. **Staging verification** (manual)
   - Test critical user flows
   - Verify Stripe webhooks
   - Check email deliverability

3. **Production deploy** (manual trigger)
   ```bash
   git tag -a v1.2.0 -m "Release v1.2.0"
   git push origin v1.2.0
   # GitHub Actions triggers production deploy
   ```

4. **Post-deploy verification** (5 minutes)
   - Health check: `/api/health`
   - Smoke tests (Playwright)
   - Monitor error rate (Sentry)

5. **Announce release**
   - Post in Slack
   - Tweet release notes
   - Email newsletter (if major release)

**Post-Deploy Checklist**

- [ ] Health check passed
- [ ] Smoke tests passed
- [ ] Error rate normal (<0.1%)
- [ ] Response time normal (<500ms p95)
- [ ] User reports monitored (first 24 hours)
- [ ] Release notes published

Generate deployment checklist + automation.
```

**Expected Output**: Deployment runbook + GitHub Actions

---

### 6. Rollback Procedure
```
Define rollback strategy for [SAAS]:

Rollback scenarios:
1. **Critical bug** (data corruption, security issue)
2. **Performance degradation** (response time >2s)
3. **High error rate** (>1% of requests failing)
4. **Database migration failure**

Rollback methods:

**Method 1: Vercel instant rollback**
- Vercel Dashboard: Click "Rollback" on previous deployment
- OR CLI: `vercel rollback <deployment-url>`
- **Duration**: 30 seconds
- **Use when**: Frontend issues only

**Method 2: Git revert + redeploy**
```bash
# Revert last commit
git revert HEAD
git push origin main

# Or revert to specific tag
git reset --hard v1.1.0
git push origin main --force
```
- **Duration**: 5 minutes
- **Use when**: Need to revert multiple commits

**Method 3: Feature flag kill switch**
- Disable problematic feature via Edge Config
- **Duration**: Instant
- **Use when**: Feature can be disabled independently

**Method 4: Database migration rollback**
```bash
# Supabase migration down
supabase db reset --db-url $DATABASE_URL --version 0001
```
- **Duration**: 10 minutes
- **Use when**: Migration causes issues
- **⚠️ Risk**: Potential data loss

**Rollback decision tree**:
1. Is it a critical issue? (SEV1)
   - Yes: Immediate rollback
   - No: Proceed to #2

2. Can we hotfix in <30 minutes?
   - Yes: Deploy hotfix
   - No: Rollback

3. Is feature flagged?
   - Yes: Disable via flag
   - No: Full rollback

**Post-rollback**:
- [ ] Verify rollback successful
- [ ] Monitor for 30 minutes
- [ ] Update status page
- [ ] Post-mortem meeting scheduled
- [ ] Create incident ticket

Generate rollback runbook.
```

**Expected Output**: `docs/rollback_procedure.md`

---

### 7. Release Branch Strategy
```
Define Git branching model for [SAAS]:

**Branch types**:

1. **main** (production)
   - Always deployable
   - Protected branch (requires PR + approval)
   - Auto-deploys to production on tag

2. **develop** (integration)
   - Latest development changes
   - Auto-deploys to staging
   - Merge source for feature branches

3. **feature/*** (feature development)
   - Created from `develop`
   - Naming: `feature/google-oauth`, `feature/team-invites`
   - Merge to `develop` via PR

4. **fix/*** (bug fixes)
   - Created from `develop` or `main` (hotfix)
   - Naming: `fix/subscription-downgrade`, `fix/email-validation`

5. **release/*** (release preparation)
   - Created from `develop`
   - Naming: `release/v1.2.0`
   - Final testing, changelog update
   - Merge to `main` + tag

**Workflow**:

New feature:
```bash
git checkout develop
git pull
git checkout -b feature/new-dashboard
# Work on feature
git push origin feature/new-dashboard
# Create PR to develop
```

Release:
```bash
git checkout develop
git pull
git checkout -b release/v1.2.0
npm version minor  # 1.1.0 → 1.2.0
npx conventional-changelog -p angular -i CHANGELOG.md -s
git add .
git commit -m "chore: prepare release v1.2.0"
git push origin release/v1.2.0
# Create PR to main
# After merge:
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

Hotfix:
```bash
git checkout main
git pull
git checkout -b fix/critical-bug
# Fix bug
npm version patch  # 1.2.0 → 1.2.1
git push origin fix/critical-bug
# Create PR to main
# After merge:
git tag -a v1.2.1 -m "Hotfix v1.2.1"
git push origin v1.2.1
# Cherry-pick to develop
git checkout develop
git cherry-pick <commit-hash>
```

Generate branching strategy docs.
```

**Expected Output**: `docs/branching_strategy.md`

---

### 8. Monitoring Release Health
```
Monitor release health post-deployment:

Key metrics:

**1. Error rate**
- Target: <0.1% of requests
- Alert threshold: >0.5%
- Monitor: Sentry error count

**2. Response time**
- Target: p95 <500ms, p99 <1s
- Alert threshold: p95 >1s
- Monitor: Vercel Analytics

**3. User engagement**
- New sign-ups (compared to pre-release)
- Feature adoption rate
- Session duration
- Monitor: PostHog

**4. Business metrics**
- Trial-to-paid conversion
- Churn rate
- Revenue (MRR/ARR)
- Monitor: Stripe + internal analytics

**5. Infrastructure**
- CPU usage
- Memory usage
- Database connections
- Monitor: Vercel metrics, Supabase dashboard

Release health dashboard:
1. Real-time metrics (first 24 hours post-release)
2. Week-over-week comparison
3. User feedback aggregation
4. Error spike detection

Automated checks:
```yaml
# .github/workflows/post-deploy-check.yml
name: Post-Deploy Health Check
on:
  workflow_dispatch:
jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: API health check
        run: curl -f https://yoursaas.com/api/health

      - name: Smoke tests
        run: npx playwright test --grep @smoke

      - name: Check error rate
        run: |
          # Query Sentry API
          ERROR_RATE=$(curl -H "Authorization: Bearer $SENTRY_TOKEN" \
            "https://sentry.io/api/0/organizations/org/stats/")
          if [ $ERROR_RATE -gt 0.5 ]; then exit 1; fi
```

Generate release monitoring dashboard.
```

**Expected Output**: Release health monitoring setup

---

### 9. Hotfix Process
```
Define hotfix workflow for critical issues:

**Hotfix trigger conditions**:
- SEV1 incident (production outage)
- Data corruption risk
- Security vulnerability
- Payment processing failure

**Hotfix process** (expedited):

1. **Identify issue** (5 minutes)
   - Error logs (Sentry)
   - User reports
   - Monitoring alerts

2. **Create hotfix branch** (2 minutes)
   ```bash
   git checkout main
   git pull
   git checkout -b fix/critical-payment-bug
   ```

3. **Implement fix** (30 minutes max)
   - Minimal code changes
   - Focus on root cause only
   - Add regression test

4. **Test on staging** (10 minutes)
   - Deploy to staging: `vercel deploy`
   - Manual verification
   - Automated tests

5. **Create PR** (5 minutes)
   - Title: `[HOTFIX] Fix critical payment bug`
   - Description: Issue, solution, verification
   - Label: `hotfix`, `sev1`

6. **Expedited review** (15 minutes)
   - Single approver required (instead of 2)
   - Slack notification to on-call engineer
   - Auto-merge if tests pass

7. **Deploy to production**
   ```bash
   git checkout main
   git merge fix/critical-payment-bug
   npm version patch
   git tag -a v1.2.1 -m "Hotfix: Critical payment bug"
   git push origin main --tags
   ```

8. **Verify fix** (15 minutes)
   - Monitor error rate (should drop immediately)
   - Test affected feature
   - Check user reports

9. **Post-hotfix**
   - Update status page
   - Notify affected customers
   - Backport to develop branch
   - Schedule post-mortem

**Hotfix communication**:
- Status page: "Investigating issue" → "Fix deployed"
- Twitter: "We're aware of [issue] and deploying a fix"
- Email (if widespread impact): "Issue resolved in v1.2.1"

Generate hotfix runbook.
```

**Expected Output**: `docs/hotfix_procedure.md`

---

### 10. Post-Mortem Template
```
Create post-mortem template for incidents:

**Post-Mortem: [Incident Title]**

**Date**: [Date of incident]
**Duration**: [Start time] - [End time] (Total: X hours)
**Severity**: SEV1 / SEV2 / SEV3
**Impact**: X% of users affected, $Y revenue impact

---

**Summary**
Brief description of what happened and the resolution.

---

**Timeline** (all times in UTC)

| Time     | Event |
|----------|-------|
| 14:23    | Deployment of v1.2.0 to production |
| 14:27    | First error reports in Sentry |
| 14:30    | PagerDuty alert triggered |
| 14:35    | Incident commander assigned |
| 14:40    | Root cause identified (payment webhook timeout) |
| 15:00    | Hotfix deployed (v1.2.1) |
| 15:15    | Verification complete, incident closed |

---

**Root Cause**
Detailed technical explanation of what caused the incident.

Example: Stripe webhook endpoint timeout due to missing database connection pooling, causing 503 errors on subscription events.

---

**Resolution**
What was done to fix the issue.

Example:
1. Rolled back to v1.1.0 (temporary)
2. Implemented database connection pooling
3. Deployed hotfix v1.2.1
4. Verified webhook processing resumed

---

**Impact**

**Users affected**: 1,234 (12% of active users)
**Duration**: 52 minutes
**Revenue impact**: Estimated $500 in failed subscriptions
**Customer support tickets**: 23

---

**What Went Well**
- Alert triggered within 4 minutes
- Root cause identified in 13 minutes
- Hotfix deployed in 37 minutes (under 1-hour SLA)

---

**What Went Wrong**
- Missing load testing for webhook endpoints
- No connection pooling in staging environment
- Insufficient monitoring for webhook processing

---

**Action Items**

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Add database connection pooling to staging | @dev | 2024-01-20 | Done |
| Implement webhook processing monitoring | @sre | 2024-01-22 | In Progress |
| Add load testing for webhooks to CI | @qa | 2024-01-25 | Pending |
| Update runbook for webhook incidents | @doc | 2024-01-20 | Done |

---

**Lessons Learned**
1. Staging environment must mirror production (connection pooling missing)
2. Load testing critical paths (webhooks) before major releases
3. Monitoring gaps: webhook processing time not tracked

Generate post-mortem template.
```

**Expected Output**: `docs/post_mortem_template.md`

---

## CLI Command Reference

```bash
# Release management
cc release "Create release v1.2.0"
cc release "Generate changelog"

# Version bumping
npm version major   # 1.0.0 → 2.0.0
npm version minor   # 1.0.0 → 1.1.0
npm version patch   # 1.0.0 → 1.0.1

# Git tagging
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
git tag -d v1.2.0  # Delete local tag
git push origin :refs/tags/v1.2.0  # Delete remote tag

# Changelog generation
npx conventional-changelog -p angular -i CHANGELOG.md -s

# Vercel deployment
vercel deploy --prod
vercel rollback https://your-deployment.vercel.app

# GitHub CLI
gh release create v1.2.0 --notes "Release notes here"
gh release list
```

---

## Output Checklist

- [ ] Semantic versioning system
- [ ] Automated changelog generation
- [ ] Release notes template + distribution
- [ ] Feature flag infrastructure
- [ ] Production deployment checklist
- [ ] Rollback procedure documented
- [ ] Git branching strategy
- [ ] Release health monitoring
- [ ] Hotfix process runbook
- [ ] Post-mortem template

---

## Success Metrics

- Deploy frequency: 10+ deploys/week
- Mean time to deploy: <15 minutes
- Rollback rate: <5% of deploys
- Hotfix time: <1 hour (SEV1)
- Post-deploy incident rate: <2%
- Changelog accuracy: 100%
- Release notes published: 100% of releases

---

## Handoff to Next Agent

Once release infrastructure complete, handoff to:
- **SRE**: For production deployment execution
- **Growth Hacker**: For release announcements
- **Revenue Engineer**: For payment feature rollouts
- **Architect**: For versioning strategy alignment
