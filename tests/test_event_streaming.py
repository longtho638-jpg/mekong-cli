"""Tests for Enhanced Event Bus with Streaming (Netdata streaming pattern)."""

import pytest
from src.core.event_bus import (
    Event,
    EventBus,
    EventStream,
    EventType,
    StreamingEventBus,
    get_event_bus,
    get_streaming_bus,
)


class TestEventStream:
    """Test bounded event stream buffer."""

    def test_push_and_read(self):
        stream = EventStream(max_buffer=100)
        event = Event(type=EventType.STEP_COMPLETED, data={"step": 1})
        stream.push(event)
        events = stream.read()
        assert len(events) == 1
        assert events[0].data["step"] == 1

    def test_cursor_increments(self):
        stream = EventStream()
        assert stream.cursor == 0
        stream.push(Event(type=EventType.GOAL_STARTED))
        assert stream.cursor == 1
        stream.push(Event(type=EventType.GOAL_COMPLETED))
        assert stream.cursor == 2

    def test_buffered_count(self):
        stream = EventStream(max_buffer=100)
        for i in range(5):
            stream.push(Event(type=EventType.STEP_COMPLETED, data={"i": i}))
        assert stream.buffered_count == 5

    def test_bounded_buffer_evicts_old(self):
        stream = EventStream(max_buffer=3)
        for i in range(5):
            stream.push(Event(type=EventType.STEP_COMPLETED, data={"i": i}))
        assert stream.buffered_count == 3
        events = stream.read()
        assert events[0].data["i"] == 2  # First two evicted

    def test_read_with_cursor(self):
        stream = EventStream(max_buffer=100)
        for i in range(10):
            stream.push(Event(type=EventType.STEP_COMPLETED, data={"i": i}))
        # Read from cursor 5 (should get events 5-9)
        events = stream.read(since_cursor=5)
        assert len(events) == 5
        assert events[0].data["i"] == 5

    def test_read_with_limit(self):
        stream = EventStream(max_buffer=100)
        for i in range(10):
            stream.push(Event(type=EventType.STEP_COMPLETED, data={"i": i}))
        events = stream.read(limit=3)
        assert len(events) == 3

    def test_read_empty_stream(self):
        stream = EventStream()
        assert stream.read() == []

    def test_clear(self):
        stream = EventStream()
        stream.push(Event(type=EventType.GOAL_STARTED))
        stream.clear()
        assert stream.buffered_count == 0
        assert stream.read() == []


class TestStreamingEventBus:
    """Test StreamingEventBus with integrated stream."""

    def test_emit_pushes_to_stream(self):
        bus = StreamingEventBus()
        bus.emit(EventType.GOAL_STARTED, {"goal": "test"})
        bus.emit(EventType.STEP_COMPLETED, {"step": 1})
        assert bus.stream.buffered_count == 2

    def test_emit_still_notifies_subscribers(self):
        bus = StreamingEventBus()
        received = []
        bus.subscribe(EventType.STEP_COMPLETED, lambda e: received.append(e))
        bus.emit(EventType.STEP_COMPLETED, {"step": 1})
        assert len(received) == 1
        assert received[0].data["step"] == 1

    def test_stream_read_after_emit(self):
        bus = StreamingEventBus(max_buffer=50)
        for i in range(5):
            bus.emit(EventType.STEP_COMPLETED, {"i": i})
        cursor_before = bus.stream.cursor
        bus.emit(EventType.GOAL_COMPLETED, {"done": True})
        new_events = bus.stream.read(since_cursor=cursor_before)
        assert len(new_events) == 1
        assert new_events[0].data["done"] is True


class TestNewEventTypes:
    """Test new event types added for netdata integration."""

    def test_step_healed_event(self):
        bus = EventBus()
        received = []
        bus.subscribe(EventType.STEP_HEALED, lambda e: received.append(e))
        bus.emit(EventType.STEP_HEALED, {"step": 3, "corrected": True})
        assert len(received) == 1

    def test_health_warning_event(self):
        bus = EventBus()
        received = []
        bus.subscribe(EventType.HEALTH_WARNING, lambda e: received.append(e))
        bus.emit(EventType.HEALTH_WARNING, {"check": "cpu", "value": 85})
        assert received[0].data["value"] == 85

    def test_health_critical_event(self):
        bus = EventBus()
        received = []
        bus.subscribe(EventType.HEALTH_CRITICAL, lambda e: received.append(e))
        bus.emit(EventType.HEALTH_CRITICAL, {"check": "memory", "value": 98})
        assert len(received) == 1

    def test_collector_discovered_event(self):
        bus = EventBus()
        event = bus.emit(EventType.COLLECTOR_DISCOVERED, {"name": "git_agent"})
        assert event.type == EventType.COLLECTOR_DISCOVERED

    def test_project_discovered_event(self):
        bus = EventBus()
        event = bus.emit(EventType.PROJECT_DISCOVERED, {"type": "python"})
        assert event.data["type"] == "python"


class TestGetStreamingBus:
    """Test streaming bus singleton factory."""

    def test_get_streaming_bus_creates_streaming_instance(self):
        import src.core.event_bus as mod
        mod._default_bus = None  # Reset singleton
        bus = get_streaming_bus()
        assert isinstance(bus, StreamingEventBus)
        assert hasattr(bus, "stream")
        # Cleanup
        mod._default_bus = None
