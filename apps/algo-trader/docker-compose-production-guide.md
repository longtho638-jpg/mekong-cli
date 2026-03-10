# Docker Compose Production Operations for AI Services (2025)

A concise guide to managing AI services in a production environment using Docker Compose.

### 1. Backup & Restore

**Strategy:** Backups are created from named volumes. The service can be running, but for data consistency, stopping the container is safer, especially for databases.

**Backup a Volume:**
This command executes `tar` inside a running service container (`my_app_service`) to create a compressed archive of the volume data (`/path/to/data`) and streams it to a local file.

```bash
# Description: Create a compressed backup of a named volume from a running service.
docker compose exec my_app_service tar czf - /path/to/data > backup-$(date +%Y-%m-%d-%H%M).tar.gz
```

**Restore a Volume:**
This command copies the backup file into a new container and extracts it.

```bash
# Description: Restore a volume from a backup file into a new or existing container.
docker compose cp backup.tar.gz my_app_service:/tmp/
docker compose exec my_app_service tar xzf /tmp/backup.tar.gz -C /path/to/data
docker compose exec my_app_service rm /tmp/backup.tar.gz
```

### 2. Zero-Downtime Upgrades & Rollbacks

**Strategy:** Use a "blue-green" deployment. This requires a reverse proxy (like NGINX or Traefik) to switch traffic between old and new versions of your service.

**Example `docker-compose.yml` with NGINX:**

```yaml
services:
  nginx:
    image: nginx:latest
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - ai_service_blue
      - ai_service_green

  ai_service_blue:
    image: my_ai_app:v1.0
    # ... healthcheck, volumes, etc.

  ai_service_green:
    image: my_ai_app:v1.1
    # ... healthcheck, volumes, etc.
```

**Upgrade Process:**

1.  **Deploy the new version (green):**
    ```bash
    # Description: Pull the latest image and start the 'green' service without restarting dependencies.
    docker compose up -d --no-deps --build ai_service_green
    ```

2.  **Verify Health:** Check logs and health status (`docker compose ps`).

3.  **Switch Traffic:** Update `nginx.conf` to point to `ai_service_green` and reload NGINX.
    ```bash
    # Description: Send a SIGHUP signal to the nginx container to gracefully reload its configuration.
    docker compose exec nginx nginx -s reload
    ```

4.  **Stop the old version (blue):**
    ```bash
    # Description: Stop the old 'blue' service.
    docker compose stop ai_service_blue
    ```

**Rollback:**
To roll back, simply update `nginx.conf` to point back to `ai_service_blue` and reload NGINX.

### 3. Health Checks

**Strategy:** Docker can check if your container is healthy using the `healthcheck` instruction in your `docker-compose.yml`.

**Example `healthcheck` for a web service:**

```yaml
services:
  my_ai_service:
    image: my_ai_app:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**Check Health Status:**
The status will show as `(healthy)` or `(unhealthy)` in the `STATUS` column.

```bash
# Description: List containers and their current status, including health checks.
docker compose ps
```

### 4. Volume Management

**Common Commands:**

*   **List Volumes:** See all volumes Docker is managing.
    ```bash
    # Description: List all Docker volumes.
    docker volume ls
    ```

*   **Inspect Volume:** Get detailed information, including the mountpoint on the host.
    ```bash
    # Description: Show detailed information for a specific volume.
    docker volume inspect my_app_data_volume
    ```

*   **Prune Unused Volumes:** Remove all volumes not currently attached to a container. **Use with caution.**
    ```bash
    # Description: Remove all unused local volumes to free up space.
    docker volume prune
    ```
