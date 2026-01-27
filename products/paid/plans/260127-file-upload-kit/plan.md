# Plan: File Upload Kit ($47)

## Task ID: TASK-FILE-UPLOAD-001

## Overview
Build a production-ready file upload system with AWS S3 and Cloudflare R2 integration, supporting multipart uploads, image optimization, and a drag-and-drop UI.

## Phases

### Phase 1: Setup & Core Logic (12h)
- [x] Initialize project (Next.js/React + TypeScript)
- [x] Setup S3 and R2 clients
- [x] Implement Presigned URL generation API
- [x] Implement `usePresignedUrl` hook

### Phase 2: Multipart & Optimization (24h)
- [x] Implement Multipart Upload logic (initiate, upload part, complete, abort)
- [x] Implement Image Optimization (Sharp)
- [x] Create `useFileUpload` hook with progress tracking

### Phase 3: UI & Packaging (36h)
- [x] Build `FileDropzone` component
- [x] Build `FileUploader` component with progress bars
- [x] Build `FilePreview` and `FileList`
- [x] Write Documentation (README, INSTALL, S3_SETUP, R2_SETUP)
- [x] Write Unit & Integration Tests
- [x] Create SALES_COPY.md
- [x] Package into ZIP (file-upload-kit-v1.0.0.zip)

## Tech Stack
- Frontend: React 18+, TypeScript, Tailwind CSS
- Backend: Next.js API Routes (Node.js)
- Storage: AWS S3 SDK v3
- Image Processing: Sharp

## Win-Win-Win
- **Anh:** New revenue stream ($47 product)
- **Agency:** Reusable asset for future projects
- **User:** Saves 15+ hours of dev time

## Questions/Risks
- **Risk:** Large file uploads timing out on serverless functions (Next.js API).
- **Mitigation:** Use direct-to-S3 uploads via presigned URLs (client uploads directly to bucket), avoiding server bottleneck.

## Next Steps
1. Initialize `package.json`
2. Install dependencies
3. Create S3/R2 client wrappers
