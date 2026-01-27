---
name: calcom
description: Open source scheduling infrastructure - Calendly alternative with white-label and CRM integration.
---

# Cal.com Integration Skill

> **Binh Pháp Chương 4: 形勢 (Disposition of Forces)**
> "善守者，藏於九地之下" - Those skilled in defense hide beneath the nine layers

## Quick Start

```bash
cd docker/calcom && docker-compose up -d
# Access at http://localhost:3001
```

## Key Features

- **White-Label**: Full branding customization
- **Calendar Sync**: Google, Outlook, Apple
- **CRM Integration**: Sync bookings to contacts
- **Stripe Payments**: Paid consultations

## AgencyOS Integration

```typescript
import { CalClient } from "@calcom/sdk";

const client = new CalClient({ apiKey: "..." });
const bookings = await client.bookings.findAll();
```

## Embed Widget

```html
<script src="https://app.cal.com/embed.js"></script>
<button data-cal="agency/consultation">Book Call</button>
```

## WIN-WIN-WIN

- 👑 ANH: Professional scheduling = client convenience
- 🏢 AGENCY: Reusable booking system for service businesses
- 🚀 CLIENT: Self-service scheduling, reduced friction
