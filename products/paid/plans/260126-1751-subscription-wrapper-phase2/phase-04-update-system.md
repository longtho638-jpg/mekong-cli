# Phase 04: Update System

## Overview
Mechanism to deliver software updates to valid license holders.

## Objectives
- Implement `VersionChecker`.
- Implement `AutoUpdater`.
- Build `ChangelogFetcher`.

## Implementation Steps
1.  **Version Checker** (`updates/version-checker.ts`):
    - Poll endpoint: `GET /v1/updates/latest`.
    - Compare local semantic version vs. remote.
2.  **Auto Updater** (`updates/auto-updater.ts`):
    - Download artifact (Zip/Binary).
    - Verify signature.
    - Hot-swap or Install prompt.
3.  **Changelog Fetcher** (`updates/changelog-fetcher.ts`):
    - Fetch MD/JSON changelog.
    - Parse for "Critical" flags.

## Security
- Updates MUST be signed.
- License key MUST be validated before download link is generated.

## Deliverables
- [ ] Version comparison logic.
- [ ] Secure download flow.
- [ ] Changelog parser.
