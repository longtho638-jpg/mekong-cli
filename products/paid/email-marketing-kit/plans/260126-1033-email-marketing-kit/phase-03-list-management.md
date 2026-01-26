# Phase 03: List Management & Compliance

> **Status**: Pending
> **Priority**: Critical
> **Dependencies**: Phase 01

## Overview
Build the system for managing subscribers, lists, segmentation, and ensuring strict legal compliance (GDPR, CAN-SPAM). This phase is crucial for maintaining sender reputation.

## Key Insights
- **Reputation is fragility**: One bad list import can ruin IP reputation. Validation and cleaning are necessary.
- **Compliance is mandatory**: Unsubscribe links must work instantly. Physical address must be present in footers.
- **Double Opt-in**: The gold standard for list hygiene.

## Requirements
### Functional
- Subscriber CRUD (email, name, attributes json).
- List/Segment management (Tags-based or Lists-based).
- CSV Import/Export with validation.
- Double Opt-in workflow (verification email).
- Unsubscribe system (Global vs List-specific).
- GDPR Tools (Data export, "Forget me" button).

### Non-Functional
- Handle large imports (background processing).
- Deduplication logic.

## Architecture
- **Models**:
  - `Subscriber`: Main user record.
  - `MailingList`: Logical grouping.
  - `SubscriberListAssociation`: Many-to-many.
  - `UnsubscribeLog`: Audit trail.
- **Processing**: Use streaming for CSV import to avoid memory spikes.

## Implementation Steps
1. **Data Models**
   - Define `Subscriber` (email unique, status: active/unconfirmed/unsubscribed/bounced).
   - Define `MailingList` and `Tag`.

2. **Subscription Flows**
   - API `POST /subscribe`: Triggers double opt-in email (if configured).
   - API `GET /verify/{token}`: Confirms subscription.

3. **Unsubscribe System**
   - Generate unique unsubscribe tokens per user/campaign.
   - Create `Unsubscribe-Link` injection logic.
   - Frontend: Simple unsubscribe confirmation page.

4. **Import/Export**
   - Implement `SubscriberImporter` service (validate email format, check MX record optional).
   - Async task for bulk import.

## Success Criteria
- [ ] Users can subscribe and confirm via email.
- [ ] Unsubscribe link successfully updates status to `unsubscribed`.
- [ ] Large CSV (10k rows) imports successfully without timing out.
- [ ] Duplicate emails are handled gracefully during import.

## Security & Compliance
- **GDPR**: Store consent timestamp and IP.
- **CAN-SPAM**: Enforce footer presence with physical address in all campaigns.
