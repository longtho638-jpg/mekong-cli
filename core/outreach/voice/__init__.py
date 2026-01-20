"""
Call Center Agent Facade.
"""
from datetime import datetime
from typing import Any, Dict, List

from .callbacks import CallbackManager
from .logging import CallLogger
from .models import CallLog, CallOutcome, CallType, ScheduledCallback


class CallCenterAgent(CallLogger, CallbackManager):
    """
    Call Center Agent System.
    Manages telephony interactions and callback schedules.
    """

    def __init__(self, agency_name: str, agent_name: str = "Assistant"):
        CallLogger.__init__(self, agent_name)
        CallbackManager.__init__(self)
        self.agency_name = agency_name

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
                f"║  Castle {self.agency_name[:40]:<40} - Voice!              ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )

        return "\n".join(lines)
