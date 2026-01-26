# Implementation Plan: Changelog Kit

> **Product**: Changelog Kit ($27)
> **Goal**: A lightweight, drop-in solution to manage and display product updates.
> **Status**: Planned
> **Date**: 260126

## 1. Objective
Build a system that parses simple Markdown or JSON files to generate a beautiful changelog page and an embeddable widget. It should also support RSS/Atom feeds for subscribers.

## 2. Architecture
- **Backend**: Python (FastAPI) or Node.js (Simple CLI/Lib).
  - *Decision*: Let's stick to **FastAPI** for consistency with previous kits and to provide a real API for the widget.
- **Storage**: Flat files (Markdown/JSON) or SQLite.
  - *Decision*: **Markdown + Frontmatter** (Jekyll/Hugo style) is developer-friendly.
- **Frontend**: React Components (Page + Widget).
- **Distribution**: Docker Compose.

## 3. Features
- 📝 **Markdown Support**: Write updates in MD with frontmatter (date, type, author).
- 🏷️ **Categories**: New, Improved, Fixed, Security.
- 📡 **RSS/Atom Feeds**: Auto-generated XML feeds.
- 🔔 **Widget**: "What's New" popup for React apps.
- 🎨 **Theming**: Tailwind CSS based.

## 4. Phases

### Phase 1: Foundation
- [ ] Project scaffolding (`backend`, `frontend`, `docker-compose.yml`).
- [ ] Sample data structure (Markdown files).

### Phase 2: Core Logic (Parser)
- [ ] Markdown parser with Metadata extraction (python-frontmatter).
- [ ] RSS Feed Generator.

### Phase 3: API Implementation
- [ ] `GET /api/v1/changelog`: List entries (paginated, filtered).
- [ ] `GET /feed.xml`: Return RSS feed.
- [ ] `GET /api/v1/latest`: Check for "unread" updates (for the widget badge).

### Phase 4: Frontend Implementation
- [ ] **Full Page Component**: A timeline view of updates.
- [ ] **Widget Component**: A bell icon + popup list.
- [ ] `useChangelog` hook.

### Phase 5: Packaging
- [ ] Documentation (`INTEGRATION.md`, `README.md`).
- [ ] Zip creation.
- [ ] Update Product Catalog.

## 5. Success Criteria
- [ ] Can parse a directory of MD files into a structured JSON response.
- [ ] RSS feed validates correctly.
- [ ] React widget correctly fetches and displays the latest updates.
