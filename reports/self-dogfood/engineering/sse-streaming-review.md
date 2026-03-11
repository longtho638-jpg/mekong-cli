# Engineering: SSE Streaming Review — Mekong CLI v5.0

## Command: /review
## Date: 2026-03-11

---

## Source: src/gateway.py, lines 277-336

GET /v1/missions/{mission_id}/stream — SSE endpoint for real-time mission progress.

---

## Implementation Review

```python
@app.get("/v1/missions/{mission_id}/stream")
async def stream_mission(mission_id: str) -> StreamingResponse:
    """Server-Sent Events (SSE) stream for real-time mission progress."""
    
    if mission_id not in MISSION_STORE:
        raise HTTPException(status_code=404, detail="Mission not found")

    async def event_generator() -> AsyncGenerator[str, None]:
        mission = MISSION_STORE[mission_id]
        
        # Send initial state
        yield f"data: {json.dumps(event)}\n\n"
        
        # Poll loop
        last_event_idx = 0
        while True:
            events = mission.get("events", [])
            if len(events) > last_event_idx:
                for evt in events[last_event_idx:]:
                    yield f"data: {json.dumps(evt)}\n\n"
                last_event_idx = len(events)
            
            if mission["status"] in ["completed", "failed", "cancelled"]:
                yield f"data: {json.dumps(final_event)}\n\n"
                break
            
            await asyncio.sleep(0.5)  # 500ms polling interval
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
```

---

## SSE Protocol Compliance

### Correct
- `media_type="text/event-stream"` — correct MIME type
- `data: {json}\n\n` format — correct SSE event format
- `Cache-Control: no-cache` — prevents caching
- `Connection: keep-alive` — maintains persistent connection
- `X-Accel-Buffering: no` — disables nginx/proxy buffering

### Missing SSE Fields
Standard SSE supports: `id:`, `event:`, `data:`, `retry:`

Only `data:` field is used. Missing:
- `id:` — event ID for client reconnection (`Last-Event-ID` header replay)
- `event:` — named event type for client-side `addEventListener(type, handler)`
- `retry:` — tells client how long to wait before reconnecting

Without `id:` field, if client disconnects mid-stream, it cannot resume from
last received event. All events replay from beginning on reconnect.

---

## Polling Architecture Problem

```python
await asyncio.sleep(0.5)  # Poll every 500ms
```

**Problem 1: Latency**
Events appear up to 500ms after they're stored in MISSION_STORE.
For a 10-step recipe executing in 5s, half-second lag is noticeable.

**Problem 2: CPU Overhead**
N concurrent streams = N coroutines waking every 500ms.
100 concurrent clients = 200 wake-ups/second, each doing a dict lookup.
At 1000 concurrent: 2000 wake-ups/second — not terrible but unnecessary.

**Better pattern: asyncio.Queue**
```python
# Per-mission event queue
mission_queues: dict[str, asyncio.Queue] = {}

# Producer: _run_hybrid_router puts events into queue
await mission_queues[mission_id].put(event)

# Consumer: event_generator reads from queue
event = await asyncio.wait_for(
    mission_queues[mission_id].get(),
    timeout=30.0  # heartbeat timeout
)
yield f"data: {json.dumps(event)}\n\n"
```

This approach: zero latency on event delivery, no CPU polling overhead.

---

## Missing: Heartbeat / Keepalive

Long-running missions (minutes) need periodic keepalives to prevent proxy timeouts.
Standard pattern:
```python
# Every 15s with no events, send comment to keep connection alive
yield ": heartbeat\n\n"
```

SSE comment lines (starting with `:`) are spec-compliant keepalives.
Current implementation has no heartbeat — connections to nginx/CloudFlare proxies
with 60s idle timeout will be dropped for long missions.

---

## Missing: Authentication

```python
@app.get("/v1/missions/{mission_id}/stream")
async def stream_mission(mission_id: str) -> StreamingResponse:
```

No authentication on SSE endpoint.
Any party who knows a mission_id can subscribe to its progress stream.
Mission IDs are likely UUIDs (hard to guess) but security-by-obscurity is insufficient.

---

## Missing: Reconnection Support

SSE spec defines `Last-Event-ID` request header for resuming after disconnect.
Client sends `Last-Event-ID: 42` → server replays events from ID 42 onward.

Current implementation:
1. No `id:` field in events — IDs not sent
2. No `Last-Event-ID` header reading
3. On reconnect, streams all events from beginning (index 0)

For long missions, full replay on reconnect sends redundant data.

---

## Response Size Concern

```python
final_event = {
    "event_type": f"mission.{mission['status']}",
    "mission_id": mission_id,
    "data": {"final_state": mission},  # Full mission dict!
    "timestamp": ...
}
```

`final_state: mission` dumps the entire mission dict as final event data.
For missions with many steps and large event arrays, this could be a large payload
sent as a single SSE event.

Better: send `final_state` with summary only (status, step counts, duration).
Full mission data is available via GET /v1/missions/{id}.

---

## Recommendations

1. **Replace polling with asyncio.Queue:** Zero latency, no CPU overhead per stream
2. **Add SSE event IDs:** `id: {event_idx}\n` before each event for reconnection support
3. **Read Last-Event-ID header:** Enable replay-from-checkpoint on reconnect
4. **Add named event types:** `event: mission.step.completed\n` for client-side filtering
5. **Add heartbeat:** `yield ": heartbeat\n\n"` every 15s to prevent proxy timeouts
6. **Add X-API-Key auth:** Validate caller owns the mission before subscribing
7. **Trim final_state:** Send only summary in final event, not full mission dict

---

## Summary
SSE implementation is functional with correct MIME type, headers, and protocol format.
Primary issues: polling at 500ms (should be event-driven), no event IDs (no reconnect support),
no heartbeat (proxy timeouts for long missions), and no authentication.
Replacing the polling loop with asyncio.Queue is the single highest-value improvement.
