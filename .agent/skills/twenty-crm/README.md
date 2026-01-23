# Twenty CRM Skill

This skill integrates [Twenty](https://twenty.com), the open-source CRM, into AgencyOS.

## Features

- **Object Management**: Companies, People, Opportunities.
- **Custom Objects**: Define your own data schema.
- **Kanban/Table Views**: Flexible data visualization.

## Usage

### Deployment

Deploy Twenty using Docker:

```bash
git clone https://github.com/twentyhq/twenty
cd twenty
docker compose up -d
```

### Integration

Twenty exposes a GraphQL and REST API for integration.

```bash
curl -X GET "http://localhost:3000/api/v1/people" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Requirements

- Docker
