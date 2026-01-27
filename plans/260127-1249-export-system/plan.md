# Plan: IPO-024-Export: Data export system

## Mission Brief
Build a comprehensive data export system with multiple formats (CSV, JSON, PDF, Excel), bulk download capabilities, async processing, and enterprise features like scheduled exports and email delivery.

## Context
- **Task ID:** TASK-59edb579
- **Priority:** High
- **Binh Pháp:** Chapter 2 作戰 (Resource management)

## Phases

### Phase 1: Setup & Dependencies
- [ ] Add dependencies to `requirements.txt` (`openpyxl`, `weasyprint`)
- [ ] Create configuration file `config/export-config.yaml`
- [ ] Create database migrations for `exports`, `export_templates`, `scheduled_exports` tables

### Phase 2: Core Export Service
- [ ] Implement `ExportService` in `backend/api/services/export_service.py`
- [ ] Implement CSV, JSON, XLSX, PDF export logic
- [ ] Ensure UTF-8 BOM for CSV
- [ ] Ensure formatting for Excel and PDF

### Phase 3: Async Worker & Queue
- [ ] Implement `process_export_job` in `workers/export_worker.py` (or appropriate location)
- [ ] Integrate with storage service (S3)
- [ ] Implement email notification (mock or real if service exists)

### Phase 4: API Endpoints
- [ ] Create `backend/api/routers/exports.py`
- [ ] Implement `POST /exports` (trigger export)
- [ ] Implement `GET /exports/{id}` (status/download)
- [ ] Implement `GET /exports/templates` (list templates)
- [ ] Implement `POST /exports/templates` (create template)

### Phase 5: Testing & Documentation
- [ ] Unit tests for `ExportService`
- [ ] Integration tests for API
- [ ] Create `docs/export-usage-guide.md`

## Q&A / Unresolved
- **Queue Service:** Need to verify `backend.services.queue_service` existence or use existing queue mechanism.
- **Storage Service:** Need to verify `backend.services.storage_service` or implement S3 upload.
- **Email Service:** Verify existing email capability.
