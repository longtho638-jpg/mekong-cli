# Phase 1: Backend Services

## Goal
Implement core CDN services: Purge, Manager, and Optimization.

## Files to Create
- `backend/services/cdn/__init__.py`
- `backend/services/cdn/manager.py`
- `backend/services/cdn/purge.py`
- `backend/services/cdn/optimization.py`

## Implementation Details
- **CDNManager**: Facade for CDN operations.
- **PurgeService**: Abstract base class and Cloudflare implementation for purging cache.
- **OptimizationService**: Logic for minifying and compressing assets (placeholder for now, or basic implementation).
