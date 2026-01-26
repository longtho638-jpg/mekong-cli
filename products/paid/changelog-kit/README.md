# Changelog Kit

**A lightweight, drop-in solution to manage and display product updates with RSS feeds and an embeddable widget.**

![Status](https://img.shields.io/badge/status-production--ready-green)
![FastAPI](https://img.shields.io/badge/fastapi-0.109-green)
![React](https://img.shields.io/badge/react-18-blue)
![Markdown](https://img.shields.io/badge/markdown-supported-blue)

## Features

- 📝 **Markdown Driven**: Manage updates as simple `.md` files with frontmatter.
- 📡 **RSS/Atom Feeds**: Automatically generated XML feeds for subscribers.
- 🔔 **React Widget**: An embeddable "What's New" bell icon and popover.
- 🎨 **Beautiful UI**: Full-page timeline view styled with Tailwind CSS.
- 🐳 **Docker Ready**: One-command deployment.

## Quick Start

### 1. Start the Stack

We provide a `docker-compose.yml` to run the backend and frontend preview together.

```bash
cd changelog-kit
docker-compose up -d --build
```

- **Backend API**: `http://localhost:8000`
- **Frontend Preview**: `http://localhost:3000`

### 2. Add an Update

Create a new file in `data/` (e.g., `data/v1.1.0.md`):

```markdown
---
title: "New Dashboard"
date: "2026-02-01"
type: "new"
author: "Your Name"
---

# Dashboard 2.0

We have completely redesigned the dashboard for better usability.

## Highlights
- Dark mode support
- Faster charts
```

Refresh the page to see it appear!

## Project Structure

```
changelog-kit/
├── backend/            # FastAPI Service
│   ├── app/
│   │   ├── services/   # Parser & Feed logic
│   │   └── api/        # Endpoints
│   ├── Dockerfile
├── frontend/           # React Component Library
│   ├── src/
│   │   ├── components/ # Widget & Page
│   │   └── lib/        # API Client
│   └── Dockerfile
├── data/               # Markdown files store
├── docs/               # Documentation
└── docker-compose.yml  # Orchestration
```

## Documentation

- [Integration Guide](docs/INTEGRATION.md) - How to add the widget/page to your React app.
- [API Reference](http://localhost:8000/docs) - Swagger UI (when running).

## License

Commercial License. You can use this in your own projects or client projects. You cannot resell the kit itself.
