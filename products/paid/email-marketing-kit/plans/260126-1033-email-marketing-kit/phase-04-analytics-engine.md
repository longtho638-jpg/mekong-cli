# Phase 04: Analytics Engine

> **Status**: Pending
> **Priority**: High
> **Dependencies**: Phase 01, Phase 02

## Overview
Implement the tracking infrastructure to measure campaign performance. This includes pixel tracking for opens, link wrapping for clicks, and handling provider webhooks for delivery status (bounces, complaints).

## Key Insights
- **Data Volume**: Analytics data grows fast. Efficient storage and aggregation are key.
- **Privacy**: Apple's Mail Privacy Protection (MPP) skews open rates. Metrics should focus on Clicks and Conversion where possible.
- **Feedback Loops**: Handling bounces/complaints via webhooks is critical to stop sending to bad actors and preserve reputation.

## Requirements
### Functional
- **Open Tracking**: Inject 1x1 invisible pixel.
- **Click Tracking**: Rewrite links to pass through a tracking endpoint.
- **Webhook Receiver**: Endpoints to receive events from SendGrid/SES/etc.
- **Dashboard**: Aggregate stats (Sent, Delivered, Opened, Clicked, Bounced).

### Non-Functional
- Low latency for tracking endpoints (redirects must be fast).
- Idempotent webhook processing.

## Architecture
- **Storage**:
  - Raw events: `CampaignEvent` table (highly write-intensive).
  - Aggregations: `CampaignStats` (updated periodically or via triggers).
- **Link Rewriter**: Service to parse HTML, find `<a>` tags, and replace `href` with tracking URL.

## Implementation Steps
1. **Tracking Infrastructure**
   - Endpoint `GET /t/o/{token}.gif`: Returns 1x1 GIF, logs 'open'.
   - Endpoint `GET /t/c/{token}`: Logs 'click', redirects to original URL.

2. **Link Wrapper Service**
   - Enhance `TemplateRenderer` (Phase 02) to inject the pixel and rewrite links before sending.

3. **Webhook Handlers**
   - Implement standard schema for events.
   - Create adapters for provider-specific payloads (SES SNS, SendGrid Webhooks) -> normalize to internal Event model.
   - Handle 'Hard Bounce' -> Auto-unsubscribe user.

4. **Reporting**
   - Create aggregation queries (Time-series data for opens/clicks).
   - API `GET /campaigns/{id}/stats`.

## Success Criteria
- [ ] Opening an email increments the 'Open' count.
- [ ] Clicking a link redirects correctly and increments 'Click' count.
- [ ] Hard bounces automatically mark the subscriber as 'Bounced' (inactive).
- [ ] Tracking endpoints respond in <50ms.

## Security Considerations
- Validate redirect URLs to prevent Open Redirect vulnerabilities (only allow links that were in the original template or whitelisted domains).
- Verify signatures of incoming webhooks.
