# Phase 02: Template Engine

> **Status**: Pending
> **Priority**: High
> **Dependencies**: Phase 01

## Overview
Develop a powerful, flexible templating engine that supports both raw HTML and MJML for responsive emails. It must allow dynamic variable substitution (personalization) and safe rendering.

## Key Insights
- **Responsive Design**: Hand-coding responsive HTML emails is painful. MJML is the industry standard for generating client-compatible HTML.
- **Safety**: Jinja2 is powerful but needs sandboxing to prevent Server-Side Template Injection (SSTI) if users can edit templates.
- **Fallback**: Always generate a `text/plain` version for accessibility and spam score optimization.

## Requirements
### Functional
- CRUD for `EmailTemplate` model.
- Render MJML to HTML (using local library or API fallback).
- Jinja2 variable substitution (`{{ name }}`, `{{ unsubscribe_link }}`).
- Preview endpoint (render with mock data).
- Automatic text-version generation from HTML (using `BeautifulSoup` or similar).

### Non-Functional
- Fast rendering (<100ms per template).
- Secure template evaluation.

## Architecture
- **MJML**: Use `mjml-python` (if available/reliable) or a dedicated microservice/CLI wrapper.
- **Templating**: `jinja2` with strict environment settings (autoescape=True).
- **Storage**: Store both source (MJML/HTML) and compiled (HTML) versions to save render time on send.

## Implementation Steps
1. **Template Models**
   - Create `EmailTemplate` model (id, name, subject, body_html, body_text, body_mjml, variables_schema).

2. **Rendering Service**
   - Implement `TemplateRenderer` class.
   - Add MJML compilation logic.
   - Add Jinja2 rendering logic.
   - Implement `html_to_text` utility.

3. **API Endpoints**
   - `POST /templates`: Create template.
   - `GET /templates/{id}/preview`: Preview with dynamic data.
   - `PUT /templates/{id}`: Update and re-compile.

## Success Criteria
- [ ] Can save an MJML template and retrieve the compiled HTML.
- [ ] Jinja2 variables are correctly substituted.
- [ ] Text version is automatically generated and legible.
- [ ] Preview endpoint returns rendered HTML.

## Security Considerations
- Sanitize input HTML if strictly allowing HTML imports.
- Limit Jinja2 context to safe variables only (no access to system calls).
