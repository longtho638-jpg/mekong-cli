# Project Changelog

All notable changes to the Mekong CLI / AgencyOS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-02-06

### Added
- **vibe-analytics**: Initial release (v1.0.0) of the Growth Telemetry Engine.
  - DORA Metrics: Deployment Frequency, Lead Time, Change Failure Rate.
  - Engineering Velocity: Cycle Time, PR metrics.
  - GitHub GraphQL Integration.
- **vibe-dev**: Initial release (v1.0.0) of the Development Workflow Layer.
  - Bidirectional sync between GitHub Projects V2 and local JSON.
  - Interactive CLI with configuration wizards.
  - Integration with `vibe-analytics` for metric tracking.
- **Documentation**: Release readiness reports and core package documentation.

### Changed
- **Dependencies**: Updated `vibe-dev` to depend on published `@agencyos/vibe-analytics@^1.0.0` instead of local file protocol.
