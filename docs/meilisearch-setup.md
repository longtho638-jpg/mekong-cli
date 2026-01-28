# Meilisearch Setup & Deployment

## Local Development

Meilisearch is included in the standard `docker-compose.yml`.

1. **Start Services:**
   ```bash
   docker-compose up -d meilisearch
   ```

2. **Verify Health:**
   Access `http://localhost:7700/health`. You should see `{"status": "available"}`.

3. **Master Key:**
   The default master key in dev is `masterKey`. If you change it in `.env`, update it in `backend/api/config/settings.py` or env vars.

## Production Deployment

### Docker

Deploy the Meilisearch image alongside your backend.

```yaml
services:
  meilisearch:
    image: getmeili/meilisearch:v1.6
    environment:
      - MEILI_MASTER_KEY=${MEILISEARCH_MASTER_KEY}
      - MEILI_ENV=production
    volumes:
      - meilisearch_data:/meili_data
    ports:
      - "7700:7700"
```

**Security Note:**
In production, ensure port `7700` is NOT exposed publicly. The backend should communicate with Meilisearch over the internal Docker network. If you must expose it, ensure the Master Key is strong.

### Backups

Meilisearch supports dumps (snapshots).

**Create Dump:**
```bash
curl -X POST \
  'http://localhost:7700/dumps' \
  -H 'Authorization: Bearer masterKey'
```

**Scheduled Backups:**
Add a cron job to trigger dumps periodically and sync the `dumps/` directory to S3/GCS.

## Performance Tuning

### Indexing Speed
- Batch your document updates. Sending 1000 documents in one batch is faster than 1000 requests of 1 document.
- Use `update_documents` instead of `add_documents` if you only need to update specific fields (partial update).

### Search Speed
- Keep `searchableAttributes` list minimal. Only include fields that users actually search for.
- Limit `filterableAttributes` and `sortableAttributes` to necessary fields.

## Troubleshooting

### "Task Stuck in Enqueued"
Meilisearch processes tasks sequentially. If a massive indexing job is running, subsequent tasks will wait.
Check task status:
```bash
curl 'http://localhost:7700/tasks?statuses=processing,enqueued' \
  -H 'Authorization: Bearer masterKey'
```

### "Disk Full"
Meilisearch can consume significant disk space. Ensure the volume has enough space.
Use `MEILI_MAX_INDEXING_MEMORY` to limit RAM usage during indexing.
