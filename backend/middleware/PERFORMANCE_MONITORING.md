# Performance Monitoring Middleware

## Overview

The Performance Monitoring Middleware tracks all API requests, logs performance metrics, and provides real-time insights into application performance.

## Features

### 1. Request Duration Logging
- Every API call is timed using high-precision `time.perf_counter()`
- Logs include: endpoint, status code, and duration
- Format: `GET /api/endpoint - 200 - 45.23ms`

### 2. Slow Query Tracking (>500ms)
- Automatically detects requests taking longer than 500ms
- Stores last 100 slow queries with timestamps
- Warning logs emitted for each slow query
- Accessible via `/metrics` endpoint

### 3. X-Response-Time Header
- Every response includes `X-Response-Time` header
- Format: `X-Response-Time: 45.23ms`
- Useful for client-side monitoring and debugging

### 4. In-Memory Metrics Storage
- Thread-safe deque-based storage (max 1000 samples)
- Per-endpoint performance breakdown
- Rolling window to prevent memory overflow
- Available via `/metrics` endpoint for dashboard integration

### 5. P99 Latency Spike Alerting
- Calculates 99th percentile (p99) latency continuously
- Maintains dynamic baseline using exponential moving average
- Alerts when current p99 exceeds 2x baseline
- 5-minute cooldown to prevent alert spam
- Logs critical alerts for monitoring systems

## Usage

### Integration (Already Done)

The middleware is integrated in `backend/main.py`:

```python
from backend.middleware import PerformanceMonitoringMiddleware

app = FastAPI()
app.add_middleware(PerformanceMonitoringMiddleware)
```

### Accessing Metrics

**Endpoint:** `GET /metrics`

**Response Format:**
```json
{
  "total_requests": 1523,
  "avg_response_time": 145.67,
  "p50": 89.23,
  "p95": 456.78,
  "p99": 892.34,
  "slow_queries_count": 12,
  "slow_queries": [
    {
      "endpoint": "POST /api/campaigns",
      "duration_ms": 678.45,
      "timestamp": "2026-01-25T06:30:15.123456"
    }
  ],
  "endpoint_breakdown": {
    "GET /api/agents": {
      "avg": 123.45,
      "count": 456,
      "max": 567.89,
      "min": 45.67
    }
  }
}
```

### Dashboard Integration

Use the `/metrics` endpoint to power a real-time performance dashboard:

```javascript
// Example: Fetch metrics every 5 seconds
setInterval(async () => {
  const response = await fetch('/metrics');
  const metrics = await response.json();

  updateDashboard({
    avgResponseTime: metrics.avg_response_time,
    p99: metrics.p99,
    slowQueries: metrics.slow_queries_count
  });
}, 5000);
```

### Programmatic Access

```python
from backend.middleware import get_metrics_summary, reset_metrics

# Get current metrics
metrics = get_metrics_summary()
print(f"P99 latency: {metrics['p99']}ms")

# Reset metrics (useful for testing or after deployment)
reset_metrics()
```

## Performance Considerations

- **Memory Usage:** Fixed maximum of 1000 request samples (rolling window)
- **CPU Overhead:** Minimal (~0.1ms per request for timing + storage)
- **Thread Safety:** Uses deque with maxlen (atomic operations)

## Alert Configuration

### P99 Spike Thresholds

- **Baseline:** Dynamic, updated via exponential moving average (0.9 weight)
- **Alert Threshold:** 2x current baseline
- **Cooldown:** 5 minutes between alerts
- **Minimum Samples:** 50 requests required before alerting

### Customization

Edit `backend/middleware/performance.py`:

```python
class MetricsStore:
    def __init__(self, max_samples: int = 1000):
        self.alert_cooldown = timedelta(minutes=5)  # Adjust cooldown
        # ...
```

## Testing

Run tests:
```bash
pytest backend/tests/test_performance_middleware.py -v
```

## Monitoring Best Practices

1. **Set up alerts** on p99 spikes in production (email, Slack, PagerDuty)
2. **Monitor slow queries** - investigate any >500ms requests
3. **Track trends** - use time-series DB (Prometheus, InfluxDB) for long-term storage
4. **Dashboard visibility** - display real-time metrics to team
5. **Performance budgets** - set SLAs (e.g., p95 < 200ms, p99 < 500ms)

## Integration with Observability Tools

### Export to Prometheus
```python
from prometheus_client import Histogram

request_duration = Histogram('http_request_duration_ms', 'HTTP request duration')

# In middleware:
request_duration.observe(duration_ms)
```

### Export to DataDog
```python
from datadog import statsd

# In middleware:
statsd.histogram('api.request.duration', duration_ms, tags=[f'endpoint:{endpoint}'])
```

## Troubleshooting

**Q: Metrics seem stale**
- Metrics use a rolling window of last 1000 requests
- For low-traffic endpoints, metrics may represent older data

**Q: P99 alerts too sensitive**
- Increase alert threshold from 2x to 3x in `check_p99_spike()`
- Increase minimum samples requirement

**Q: Want to exclude health checks from metrics**
- Add filter in `dispatch()` method:
  ```python
  if request.url.path in ['/health', '/']:
      return await call_next(request)
  ```

## Future Enhancements

- [ ] Persistent storage (Redis, PostgreSQL)
- [ ] Real-time WebSocket metrics streaming
- [ ] Anomaly detection (ML-based)
- [ ] Database query profiling integration
- [ ] Custom percentiles (p75, p90, etc.)
- [ ] Geographic latency breakdown
- [ ] Error rate correlation
