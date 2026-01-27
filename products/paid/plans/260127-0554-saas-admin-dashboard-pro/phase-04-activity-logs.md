# Phase 4: Activity Logs

## Overview
Implement the Audit Trail system to track user actions for security and compliance.

## Objectives
- [ ] Build Activity Log Table.
- [ ] Implement Advanced Filtering (Actor, Action, Date, Resource).
- [ ] Detail View for Log Entry.
- [ ] Export functionality (CSV).

## Architecture
- **Data**: Mock large dataset (1000+ rows) to test performance.
- **Table**: TanStack Table (Server-side pagination simulation).

## Implementation Steps

### 1. Log UI
- Create `LogTable.tsx`.
- Columns: Timestamp, Actor (User), Action (Create/Update/Delete), Resource, Status.
- Add "Severity" badges (Info, Warning, Critical).

### 2. Filtering
- Add Faceted Filter (Status, Action).
- Add Date Range Picker.

### 3. Export
- Implement `exportToCSV` utility.

## Verification
- Filtering works instantly (or robustly if server-side).
- Pagination works correctly.
- Export generates valid CSV.
