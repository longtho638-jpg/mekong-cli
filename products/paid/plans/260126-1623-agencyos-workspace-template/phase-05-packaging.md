# Phase 5: Packaging & Distribution

**Context Links**
- [Final Patterns Research](../reports/researcher-260126-1630-final-patterns.md)

## Overview
**Date:** 260126
**Priority:** P2
**Status:** Pending
**Description:** Finalize the workspace template, verify its integrity, and package it into a versioned ZIP file with checksums for distribution.

## Key Insights
- **Cleanliness:** Remove `node_modules`, `.git`, `.DS_Store` before packaging.
- **Naming:** Use semantic versioning (v1.0.0).
- **Integrity:** Generate SHA256 checksums to ensure file integrity.
- **Meta-Docs:** Ensure the "How to use this template" docs are distinct from the "Agency Docs".

## Requirements
- Final audit of the file structure.
- Removal of any development artifacts (`node_modules`, logs).
- Create a ZIP archive: `agencyos-workspace-template-v1.0.0.zip`.
- Generate `agencyos-workspace-template-v1.0.0.zip.sha256`.
- Create a `manifest.json` listing contents.

## Architecture
**Output:**
- `agencyos-workspace-template-v1.0.0.zip`
- `agencyos-workspace-template-v1.0.0.zip.sha256`

## Related Code Files
- `agencyos-workspace-template/` (Source)
- `release/` (Output directory)

## Implementation Steps
1.  Run a final cleanup script to remove temporary files.
2.  Verify `setup.sh` is executable.
3.  Verify all placeholders (`{{AGENCY_NAME}}`) are present and correct.
4.  Create `release/` directory.
5.  Zip the `agencyos-workspace-template/` folder (excluding `node_modules`, `.git`).
6.  Generate SHA256 checksum.
7.  Write `manifest.json` describing the package version and contents.

## Todo List
- [ ] Perform final file audit
- [ ] Clean development artifacts
- [ ] Create `release/` directory
- [ ] Create ZIP package
- [ ] Generate Checksum
- [ ] Create Manifest
- [ ] Verify ZIP extraction and setup

## Success Criteria
- ZIP file is created.
- ZIP file size is optimized (no `node_modules`).
- Checksum matches.
- Extracted folder structure is correct.

## Risk Assessment
- **Risk:** Inclusion of large files or secrets.
- **Mitigation:** Strict `zip` exclusion list and manual review of file list.

## Next Steps
- Notify distribution channels.
