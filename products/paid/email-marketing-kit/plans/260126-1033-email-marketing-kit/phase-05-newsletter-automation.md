# Phase 05: Newsletter & Automation

> **Status**: Pending
> **Priority**: High
> **Dependencies**: Phase 03, Phase 04

## Overview
This phase connects the dots: taking a list of subscribers and a template, and reliably delivering messages. It introduces background processing for sending large volumes of email without blocking the application.

## Key Insights
- **Throttling**: Providers have rate limits (e.g., 14 emails/sec). The system must respect these to avoid blocking.
- **Failures**: Network blips happen. Retry logic with exponential backoff is non-negotiable.
- **Scheduling**: "Send at 9 AM" is a standard feature.

## Requirements
### Functional
- **Campaign Management**: Create, Edit, Schedule, Send, Cancel.
- **Test Sending**: Send a sample to self before broadcast.
- **Queue System**: Background workers to process the send loop.
- **Throttling**: Configurable send rate.

### Non-Functional
- **Reliability**: Zero message loss during restart.
- **Scalability**: Capable of sending 10k+ emails/hour (dependent on provider).

## Architecture
- **Queue**: Redis (using `arq` or `Celery` or `saq`). `arq` is good for async python.
- **Worker**: Separate process consuming the queue.
- **Scheduler**: Logic to pick up "Scheduled" campaigns and push them to the Queue.

## Implementation Steps
1. **Campaign Models**
   - `Campaign`: (id, subject, template_id, list_ids, status, scheduled_at, sent_count).

2. **Sending Logic (The "Engine")**
   - Implement `CampaignDispatcher`:
     1. Fetch active subscribers from lists.
     2. Render template for each (personalization).
     3. Generate unique unsubscribe/tracking links.
     4. Push to Queue.

3. **Background Workers**
   - `SendEmailJob`: Takes (email, rendered_body, subject). Calls `EmailProvider`.
   - Implement rate limiting logic (token bucket or simple sleep).
   - Error handling: Retry 3 times, then mark as failed.

4. **Scheduling**
   - Cron-like task checking for `status='scheduled'` and `scheduled_at <= now()`.

## Success Criteria
- [ ] Campaign sends to all list members.
- [ ] Personalization works per recipient.
- [ ] Sending respects defined rate limits.
- [ ] System recovers from worker restart without double-sending (mostly).

## Security Considerations
- Ensure campaign author has permission to send to the selected list.
- Prevent IDOR on campaign management.
