# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-26

### Added
- Initial release of the Feedback Widget Kit.
- **Backend**: FastAPI service with SQLite/Postgres support.
  - Endpoints for submitting feedback (text, rating, screenshot).
  - Admin endpoints for listing, updating, and deleting feedback.
  - Static file serving for screenshots.
- **Widget**: React component (`FeedbackWidget`) with Tailwind CSS.
  - Customizable trigger button.
  - Screenshot capture using `html2canvas`.
  - Star rating and feedback type selection (General, Bug, Feature).
  - Responsive design.
- **Dashboard**: Admin dashboard for managing feedback.
  - List view with filtering and sorting.
  - Detail view with screenshot preview.
- **Documentation**: Comprehensive guides for installation, integration, API, and configuration.
- **Deployment**: `docker-compose.yml` for easy deployment.
