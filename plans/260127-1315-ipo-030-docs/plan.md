# Plan: IPO-030-Docs Implementation

## 📋 Context
**Mission:** Build comprehensive Documentation System for AgencyOS IPO readiness.
**Priority:** High (Due Diligence).
**Frameworks:** Docusaurus (Docs), FastAPI (OpenAPI), Conventional Commits (Changelog).

## 🚀 Phases

### Phase 1: Environment & Docusaurus Setup
- [ ] Initialize Docusaurus project in `docs-site/` (to avoid conflict with existing `docs/` initially, or move `docs/` content into it).
    - *Decision*: I will create `docs-site` and then migrate valid content from `docs/` into `docs-site/docs/` and potentially replace `docs/` with the build output or keep `docs-site` as the source. Given the repo structure, having `docs-site` (or `website`) is cleaner. Let's call it `docs-portal`.
- [ ] Configure Docusaurus (`docusaurus.config.js`) for AgencyOS branding.
- [ ] Setup versioning and i18n support.

### Phase 2: API Documentation
- [ ] Implement `custom_openapi` in `backend/api/openapi.py` (or similar).
- [ ] Create script `scripts/docs/generate-api-docs.sh`.
- [ ] Integrate Swagger UI / Redoc into Docusaurus.
- [ ] Add Interactive API Playground components.

### Phase 3: Content Migration & Creation
- [ ] Migrate relevant `docs/*.md` to `docs-portal/docs/`.
- [ ] Create structure: `getting-started`, `guides`, `tutorials`, `api`.
- [ ] Write missing critical guides (`installation.md`, `authentication.md`).

### Phase 4: Automation & Changelog
- [ ] Create `scripts/docs/generate-changelog.sh`.
- [ ] Create `scripts/docs/bump-version.sh`.
- [ ] Configure GitHub Actions workflow `docs-deploy.yml`.

### Phase 5: Search & Polish
- [ ] Configure Algolia search (mock or placeholder if no credentials).
- [ ] Verify links and spell check.
- [ ] Final verification of "Win-Win-Win".

## 📂 Implementation Details

### Paths
- Plan: `plans/260127-1315-ipo-030-docs/plan.md`
- Backend: `backend/`
- Docs Source: `docs/`
- New Docs Portal: `docs-portal/` (will be the Docusaurus root)

### Key Files
- `docs-portal/docusaurus.config.js`
- `backend/api/openapi.py`
- `scripts/docs/generate-api-docs.sh`
- `scripts/docs/generate-changelog.sh`
