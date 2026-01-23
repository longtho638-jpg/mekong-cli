# Formbricks Skill

This skill integrates [Formbricks](https://formbricks.com), an open-source experience management suite.

## Features

- **Surveys**: In-app, link, and email surveys.
- **Analysis**: Insightful data analysis.
- **NPS/CSAT**: Pre-built templates for customer satisfaction.

## Usage

### Deployment

Deploy Formbricks using Docker:

```bash
git clone https://github.com/formbricks/formbricks
cd formbricks
docker compose up -d
```

### Integration

Add the Formbricks SDK to your frontend application:

```typescript
import formbricks from "@formbricks/js";

if (typeof window !== "undefined") {
  formbricks.init({
    environmentId: "YOUR_ENV_ID",
    apiHost: "https://app.formbricks.com",
  });
}
```

## Requirements

- Docker (for self-hosting)
