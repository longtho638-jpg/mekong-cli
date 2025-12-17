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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


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
    """A call log entry."""
    id: str
    client: str
    phone: str
    call_type: CallType
    duration_seconds: int
    outcome: CallOutcome
    notes: str
    agent: str
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class ScheduledCallback:
    """A scheduled callback."""
    id: str
    client: str
    phone: str
    scheduled_time: datetime
    reason: str
    completed: bool = False


class CallCenterAgent:
    """
    Call Center Agent.
    
    Voice support.
    """
    
    def __init__(self, agency_name: str, agent_name: str = ""):
        self.agency_name = agency_name
        self.agent_name = agent_name
        self.calls: List[CallLog] = []
        self.callbacks: List[ScheduledCallback] = []
    
    def log_call(
        self,
        client: str,
        phone: str,
        call_type: CallType,
        duration_seconds: int,
        outcome: CallOutcome,
        notes: str
    ) -> CallLog:
        """Log a call."""
        call = CallLog(
            id=f"CALL-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            phone=phone,
            call_type=call_type,
            duration_seconds=duration_seconds,
            outcome=outcome,
            notes=notes,
            agent=self.agent_name
        )
        self.calls.append(call)
        return call
    
    def schedule_callback(
        self,
        client: str,
        phone: str,
        scheduled_time: datetime,
        reason: str
    ) -> ScheduledCallback:
        """Schedule a callback."""
        callback = ScheduledCallback(
            id=f"CB-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            phone=phone,
            scheduled_time=scheduled_time,
            reason=reason
        )
        self.callbacks.append(callback)
        return callback
    
    def complete_callback(self, callback: ScheduledCallback):
        """Mark callback as complete."""
        callback.completed = True
    
    def get_pending_callbacks(self) -> List[ScheduledCallback]:
        """Get pending callbacks."""
        return [c for c in self.callbacks if not c.completed]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get call statistics."""
        today = datetime.now().date()
        today_calls = [c for c in self.calls if c.timestamp.date() == today]
        
        total_duration = sum(c.duration_seconds for c in today_calls)
        avg_duration = total_duration / len(today_calls) if today_calls else 0
        
        return {
            "calls_today": len(today_calls),
            "total_duration": total_duration,
            "avg_duration": avg_duration,
            "pending_callbacks": len(self.get_pending_callbacks()),
            "resolved": sum(1 for c in today_calls if c.outcome == CallOutcome.RESOLVED)
        }
    
    def format_dashboard(self) -> str:
        """Format call center agent dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📞 CALL CENTER AGENT                                     ║",
            f"║  {stats['calls_today']} calls today │ {stats['pending_callbacks']} pending callbacks         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 TODAY'S STATS                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📞 Calls:           {stats['calls_today']:>5}                            ║",
            f"║    ⏱️ Total Duration:  {stats['total_duration'] // 60:>5} min                        ║",
            f"║    ⏳ Avg Duration:    {stats['avg_duration'] / 60:>5.1f} min                        ║",
            f"║    ✅ Resolved:        {stats['resolved']:>5}                            ║",
            "║                                                           ║",
            "║  📋 RECENT CALLS                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"inbound": "📥", "outbound": "📤", "follow_up": "🔄", "scheduled": "📅"}
        outcome_icons = {"resolved": "✅", "follow_up_needed": "🔄", "escalated": "⬆️", "no_answer": "❌", "voicemail": "📧", "callback_requested": "📞"}
        
        for call in self.calls[-4:]:
            t_icon = type_icons.get(call.call_type.value, "📞")
            o_icon = outcome_icons.get(call.outcome.value, "⚪")
            duration = f"{call.duration_seconds // 60}:{call.duration_seconds % 60:02d}"
            
            lines.append(f"║  {t_icon} {o_icon} {call.client[:15]:<15} │ {duration:>5} │ {call.notes[:15]:<15}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📅 PENDING CALLBACKS                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for cb in self.get_pending_callbacks()[:3]:
            time_str = cb.scheduled_time.strftime("%H:%M")
            lines.append(f"║    📞 {cb.client[:15]:<15} │ {time_str} │ {cb.reason[:18]:<18}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📞 Log Call]  [📅 Schedule]  [📊 Reports]               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Voice of the company!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    agent = CallCenterAgent("Saigon Digital Hub", "Mike")
    
    print("📞 Call Center Agent")
    print("=" * 60)
    print()
    
    agent.log_call("Sunrise Realty", "+84123456789", CallType.INBOUND, 245, CallOutcome.RESOLVED, "Billing question")
    agent.log_call("Coffee Lab", "+84987654321", CallType.OUTBOUND, 180, CallOutcome.FOLLOW_UP_NEEDED, "Proposal follow-up")
    agent.log_call("Tech Startup", "+84555666777", CallType.INBOUND, 310, CallOutcome.ESCALATED, "Complaint about delay")
    agent.log_call("Fashion Brand", "+84111222333", CallType.OUTBOUND, 0, CallOutcome.NO_ANSWER, "Renewal call")
    
    # Schedule callbacks
    agent.schedule_callback("Fashion Brand", "+84111222333", datetime.now() + timedelta(hours=2), "Renewal discussion")
    agent.schedule_callback("Coffee Lab", "+84987654321", datetime.now() + timedelta(hours=4), "Proposal details")
    
    print(agent.format_dashboard())
