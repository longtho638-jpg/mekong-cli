# Cal.com Skill

This skill integrates [Cal.com](https://cal.com), the open-source scheduling infrastructure, into AgencyOS.

## Features

- **Scheduling**: Booking appointments and meetings.
- **White-label**: Embeddable booking pages.
- **API-driven**: Full control over scheduling flow.

## Usage

This skill can be used to manage bookings programmatically or embed scheduling into client portals.

### Deployment

Deploy Cal.com using Docker:

```bash
git clone https://github.com/calcom/cal.com.git
cd cal.com
cp .env.example .env
docker compose up -d
```

### API Usage

```typescript
// Example: Create a booking via API (conceptual)
const response = await fetch('https://api.cal.com/v1/bookings', {
  method: 'POST',
  body: JSON.stringify({
    eventTypeId: 123,
    start: '2023-01-01T10:00:00Z',
    // ...
  })
});
```

## Requirements

- Node.js / Docker
- Cal.com instance (hosted or self-hosted)
