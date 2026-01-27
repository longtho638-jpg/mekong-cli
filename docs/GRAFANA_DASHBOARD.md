# 📊 Grafana Dashboard Configuration

> **"Nhìn xa trông rộng"** - Visualize everything.

**Last Updated:** 2026-01-27

---

## 1. Overview

This document describes the Grafana dashboard setup for AgencyOS. We use Grafana to visualize metrics from our backend API, database, and infrastructure.

**Data Sources:**
- **Prometheus:** Scrapes `/metrics` endpoint from FastAPI backend.
- **PostgreSQL:** Direct queries for business metrics.
- **CloudWatch/Google Monitoring:** Infrastructure metrics.

---

## 2. Dashboard Structure

### 2.1 System Overview (Row 1)

| Panel | Type | Metric | Description |
|-------|------|--------|-------------|
| **Total Requests** | Stat | `sum(rate(http_requests_total[5m]))` | Requests per second |
| **Error Rate** | Stat | `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))` | Percentage of 5xx errors |
| **Latency (P95)** | Gauge | `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m]) by (le)))` | 95th percentile latency |
| **Active Users** | Stat | `count(distinct_users_1h)` | Users active in last hour |

### 2.2 API Performance (Row 2)

| Panel | Type | Metric | Description |
|-------|------|--------|-------------|
| **Request Rate by Endpoint** | Time Series | `sum(rate(http_requests_total[5m])) by (path)` | Top 10 endpoints by traffic |
| **Latency Heatmap** | Heatmap | `rate(http_request_duration_seconds_bucket[5m])` | Distribution of response times |
| **Errors by Type** | Bar Gauge | `sum(rate(http_requests_total{status=~"4..|5.."}[5m])) by (status)` | Breakdown of 4xx/5xx errors |

### 2.3 Business Metrics (Row 3) - SQL Data Source

| Panel | Type | Query | Description |
|-------|------|-------|-------------|
| **New Signups** | Bar Chart | `SELECT date_trunc('day', created_at), count(*) FROM users GROUP BY 1` | Daily user growth |
| **Total Revenue (MRR)** | Stat | `SELECT sum(amount) FROM subscriptions WHERE status='active'` | Current MRR |
| **Active Subscriptions** | Time Series | `SELECT status, count(*) FROM subscriptions GROUP BY status` | Subscription health |

### 2.4 Infrastructure (Row 4)

| Panel | Type | Metric | Description |
|-------|------|--------|-------------|
| **CPU Usage** | Time Series | `container_cpu_usage_seconds_total` | CPU utilization per container |
| **Memory Usage** | Time Series | `container_memory_usage_bytes` | RAM usage per container |
| **DB Connections** | Time Series | `pg_stat_activity_count` | Active database connections |

---

## 3. Setup Instructions

### 3.1 Install Grafana (Local/Docker)

```yaml
# docker-compose.yml
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana-storage:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### 3.2 Configure Prometheus

1. Add Prometheus service to `docker-compose.yml`:
   ```yaml
   prometheus:
     image: prom/prometheus
     volumes:
       - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
   ```

2. Create `config/prometheus.yml`:
   ```yaml
   scrape_configs:
     - job_name: 'mekong-api'
       scrape_interval: 15s
       metrics_path: '/metrics'
       static_configs:
         - targets: ['app:8000']
   ```

### 3.3 Import Dashboard

1. Log in to Grafana (`http://localhost:3000`).
2. Go to **Dashboards** -> **New** -> **Import**.
3. Upload the JSON file from `ops/grafana/agencyos-dashboard.json`.
4. Select your Prometheus data source.

---

## 4. Alerts

Configure Grafana Alerting for these conditions:

1. **High Error Rate:** > 1% of requests are 5xx for 5 minutes.
2. **High Latency:** P95 latency > 2000ms for 5 minutes.
3. **Low Revenue:** Daily revenue drops by > 50% compared to previous day.

**Notification Channels:**
- Slack: #alerts
- Email: ops@agencyos.network

---

## 5. Maintenance

- **Weekly:** Review dashboard for slow queries.
- **Monthly:** Update Grafana version.
- **Quarterly:** Review business metrics relevance.

---

🏯 **"Thấy rõ thì làm đúng"** - See clearly to act correctly.
