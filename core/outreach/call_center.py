"""
📞 Call Center Agent - Phone Support
======================================

Handle inbound and outbound calls.
Voice of the company!

Roles:
- Inbound calls
- Outbound calls
- Call logging
- Follow-ups
"""

import logging
import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class CallType(Enum):
    """Call types."""

    INBOUND = "inbound"
    OUTBOUND = "outbound"
    FOLLOW_UP = "follow_up"
    SCHEDULED = "scheduled"


class CallOutcome(Enum):
    """Call outcomes."""

    RESOLVED = "resolved"
    FOLLOW_UP_NEEDED = "follow_up_needed"
    ESCALATED = "escalated"
    NO_ANSWER = "no_answer"
    VOICEMAIL = "voicemail"
    CALLBACK_REQUESTED = "callback_requested"


@dataclass
class CallLog:
    """A call log record entity."""

    id: str
    client: str
    phone: str
    call_type: CallType
    duration_seconds: int
    outcome: CallOutcome
    notes: str
    agent: str
    timestamp: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if self.duration_seconds < 0:
            raise ValueError("Duration cannot be negative")


@dataclass
class ScheduledCallback:
    """A scheduled callback record."""

    id: str
    client: str
    phone: str
    scheduled_time: datetime
    reason: str
    completed: bool = False


class CallCenterAgent:
    """
    Call Center Agent System.

    Manages telephony interactions and callback schedules.
    """

    def __init__(self, agency_name: str, agent_name: str = "Assistant"):
        self.agency_name = agency_name
        self.agent_name = agent_name
        self.calls: List[CallLog] = []
        self.callbacks: List[ScheduledCallback] = []
        logger.info(f"Call Center Agent initialized for {agency_name} (Agent: {agent_name})")

    def _validate_phone(self, phone: str) -> bool:
        """Simple phone number validation."""
        # Allow numbers, plus, spaces, and dashes
        return bool(re.match(r"^\+?[\d\s\-]{7,20}$", phone))

    def log_call(
        self,
        client: str,
        phone: str,
        call_type: CallType,
        duration_seconds: int,
        outcome: CallOutcome,
        notes: str,
    ) -> CallLog:
        """Record a completed call."""
        if not client:
            raise ValueError("Client name required")
        if not self._validate_phone(phone):
            logger.warning(f"Logging call with questionable phone format: {phone}")

        call = CallLog(
            id=f"CALL-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            phone=phone,
            call_type=call_type,
            duration_seconds=duration_seconds,
            outcome=outcome,
            notes=notes,
            agent=self.agent_name,
        )
        self.calls.append(call)
        logger.info(f"Call logged: {client} ({call_type.value}) - {outcome.value}")
        return call

    def schedule_callback(
        self, client: str, phone: str, scheduled_time: datetime, reason: str
    ) -> ScheduledCallback:
        """Register a future callback."""
        if scheduled_time < datetime.now():
            logger.warning(f"Scheduling callback in the past for {client}")

        callback = ScheduledCallback(
            id=f"CB-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            phone=phone,
            scheduled_time=scheduled_time,
            reason=reason,
        )
        self.callbacks.append(callback)
        logger.info(f"Callback scheduled: {client} at {scheduled_time.strftime('%H:%M')}")
        return callback

    def complete_callback(self, callback_id: str) -> bool:
        """Mark a specific callback as handled."""
        for cb in self.callbacks:
            if cb.id == callback_id:
                cb.completed = True
                logger.info(f"Callback completed: {cb.client}")
                return True
        return False

    def get_pending_callbacks(self) -> List[ScheduledCallback]:
        """Filter callbacks that haven't been completed yet."""
        return [c for c in self.callbacks if not c.completed]

    def get_stats(self) -> Dict[str, Any]:
        """Calculate daily performance statistics."""
        today = datetime.now().date()
        today_calls = [c for c in self.calls if c.timestamp.date() == today]

        total_duration = sum(c.duration_seconds for c in today_calls)
        avg_duration = total_duration / len(today_calls) if today_calls else 0.0

        return {
            "calls_today": len(today_calls),
            "total_duration": total_duration,
            "avg_duration": avg_duration,
            "pending_callbacks": len(self.get_pending_callbacks()),
            "resolved": sum(1 for c in today_calls if c.outcome == CallOutcome.RESOLVED),
        }

    def format_dashboard(self) -> str:
        """Render Call Center Dashboard."""
        stats = self.get_stats()

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📞 CALL CENTER{' ' * 42}║",
            f"║  {stats['calls_today']} calls today │ {stats['pending_callbacks']} pending callbacks{' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 TODAY'S PERFORMANCE                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    📞 Total Calls:     {stats['calls_today']:>5}                            ║",
            f"║    ⏱️ Total Time:      {stats['total_duration'] // 60:>5} min                        ║",
            f"║    ⏳ Avg Time:        {stats['avg_duration'] / 60:>5.1f} min                        ║",
            f"║    ✅ Resolved:        {stats['resolved']:>5}                            ║",
            "║                                                           ║",
            "║  📋 RECENT ACTIVITY                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        type_icons = {
            CallType.INBOUND: "📥",
            CallType.OUTBOUND: "📤",
            CallType.FOLLOW_UP: "🔄",
            CallType.SCHEDULED: "📅",
        }
        outcome_icons = {
            CallOutcome.RESOLVED: "✅",
            CallOutcome.FOLLOW_UP_NEEDED: "🔄",
            CallOutcome.ESCALATED: "⬆️",
            CallOutcome.NO_ANSWER: "❌",
            CallOutcome.VOICEMAIL: "📧",
            CallOutcome.CALLBACK_REQUESTED: "📞",
        }

        # Show last 4 calls
        for call in self.calls[-4:]:
            t_icon = type_icons.get(call.call_type, "📞")
            o_icon = outcome_icons.get(call.outcome, "⚪")
            dur_str = f"{call.duration_seconds // 60}:{call.duration_seconds % 60:02d}"
            client_display = (call.client[:15] + "..") if len(call.client) > 17 else call.client
            note_display = (call.notes[:15] + "..") if len(call.notes) > 17 else call.notes

            lines.append(
                f"║  {t_icon} {o_icon} {client_display:<17} │ {dur_str:>5} │ {note_display:<17}  ║"
            )

        lines.extend(
            [
                "║                                                           ║",
                "║  📅 PENDING CALLBACKS                                     ║",
                "║  ───────────────────────────────────────────────────────  ║",
            ]
        )

        # Show top 3 pending callbacks
        for cb in self.get_pending_callbacks()[:3]:
            time_str = cb.scheduled_time.strftime("%H:%M")
            client_display = (cb.client[:15] + "..") if len(cb.client) > 17 else cb.client
            reason_display = (cb.reason[:18] + "..") if len(cb.reason) > 20 else cb.reason
            lines.append(f"║    📞 {client_display:<17} │ {time_str} │ {reason_display:<20}  ║")

        lines.extend(
            [
                "║                                                           ║",
                "║  [📞 Log Call]  [📅 Schedule]  [📊 Reports]               ║",
                "╠═══════════════════════════════════════════════════════════╣",
                f"║  🏯 {self.agency_name[:40]:<40} - Voice!              ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📞 Initializing Call Center Agent...")
    print("=" * 60)

    try:
        agent = CallCenterAgent("Saigon Digital Hub", "Mike")

        agent.log_call(
            "Sunrise Realty",
            "+84123456789",
            CallType.INBOUND,
            245,
            CallOutcome.RESOLVED,
            "Billing question",
        )
        agent.log_call(
            "Coffee Lab",
            "+84987654321",
            CallType.OUTBOUND,
            180,
            CallOutcome.FOLLOW_UP_NEEDED,
            "Proposal follow-up",
        )
        agent.log_call(
            "Tech Startup",
            "+84555666777",
            CallType.INBOUND,
            310,
            CallOutcome.ESCALATED,
            "Complaint delay",
        )
        agent.log_call(
            "Fashion Brand",
            "+84111222333",
            CallType.OUTBOUND,
            0,
            CallOutcome.NO_ANSWER,
            "Renewal call",
        )

        # Schedule callbacks
        agent.schedule_callback(
            "Fashion Brand",
            "+84111222333",
            datetime.now() + timedelta(hours=2),
            "Renewal discussion",
        )
        agent.schedule_callback(
            "Coffee Lab", "+84987654321", datetime.now() + timedelta(hours=4), "Proposal details"
        )

        print("\n" + agent.format_dashboard())

    except Exception as e:
        logger.error(f"Runtime Error: {e}")
