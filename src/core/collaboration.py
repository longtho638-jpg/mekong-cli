"""
Mekong CLI - Multi-Agent Collaboration Protocol (AGI v2)

Enables agents to communicate, negotiate tasks, peer review,
and debate approaches. Supports role assignment and emergent specialization.
"""

import logging
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

from .event_bus import EventType, get_event_bus

logger = logging.getLogger(__name__)


class AgentRole(str, Enum):
    """Predefined agent roles for collaboration."""

    IMPLEMENTER = "implementer"
    REVIEWER = "reviewer"
    TESTER = "tester"
    PLANNER = "planner"
    RESEARCHER = "researcher"
    DEBUGGER = "debugger"


class MessageType(str, Enum):
    """Types of inter-agent messages."""

    TASK_REQUEST = "task_request"
    TASK_RESPONSE = "task_response"
    REVIEW_REQUEST = "review_request"
    REVIEW_RESPONSE = "review_response"
    PROPOSAL = "proposal"
    COUNTER_PROPOSAL = "counter_proposal"
    VOTE = "vote"
    STATUS_UPDATE = "status_update"
    KNOWLEDGE_SHARE = "knowledge_share"


@dataclass
class AgentMessage:
    """A message between agents."""

    id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    sender: str = ""
    receiver: str = ""  # Empty = broadcast
    message_type: MessageType = MessageType.STATUS_UPDATE
    content: str = ""
    data: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)
    reply_to: str = ""  # ID of message being replied to


@dataclass
class AgentProfile:
    """Profile of a collaborative agent."""

    name: str
    role: AgentRole = AgentRole.IMPLEMENTER
    capabilities: List[str] = field(default_factory=list)
    success_count: int = 0
    failure_count: int = 0
    specializations: Dict[str, float] = field(default_factory=dict)
    active: bool = True

    @property
    def success_rate(self) -> float:
        total = self.success_count + self.failure_count
        return self.success_count / total if total > 0 else 0.5

    @property
    def best_specialization(self) -> str:
        if not self.specializations:
            return "general"
        return max(self.specializations, key=self.specializations.get)  # type: ignore[arg-type]


@dataclass
class DebateProposal:
    """A proposal in a multi-agent debate."""

    id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])
    proposer: str = ""
    approach: str = ""
    reasoning: str = ""
    estimated_effort: str = ""
    votes_for: List[str] = field(default_factory=list)
    votes_against: List[str] = field(default_factory=list)
    timestamp: float = field(default_factory=time.time)

    @property
    def vote_score(self) -> int:
        return len(self.votes_for) - len(self.votes_against)


@dataclass
class ReviewResult:
    """Result of a peer review."""

    reviewer: str = ""
    target: str = ""  # What was reviewed
    approved: bool = False
    score: float = 0.0  # 0.0-1.0
    feedback: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    timestamp: float = field(default_factory=time.time)


class CollaborationProtocol:
    """
    Multi-agent collaboration protocol.

    Manages agent registration, role assignment, task negotiation,
    peer review, and debate among agents.
    """

    MAX_MESSAGES: int = 500
    MAX_AGENTS: int = 20

    def __init__(self, llm_client: Optional[Any] = None) -> None:
        """Initialize collaboration protocol."""
        self.llm_client = llm_client
        self._agents: Dict[str, AgentProfile] = {}
        self._messages: List[AgentMessage] = []
        self._debates: Dict[str, List[DebateProposal]] = {}
        self._reviews: List[ReviewResult] = []

    def register_agent(
        self,
        name: str,
        role: AgentRole = AgentRole.IMPLEMENTER,
        capabilities: Optional[List[str]] = None,
    ) -> AgentProfile:
        """
        Register an agent for collaboration.

        Args:
            name: Unique agent name.
            role: Agent's primary role.
            capabilities: List of what this agent can do.

        Returns:
            Registered AgentProfile.
        """
        profile = AgentProfile(
            name=name,
            role=role,
            capabilities=capabilities or [],
        )
        self._agents[name] = profile
        self._broadcast(
            name, MessageType.STATUS_UPDATE,
            f"Agent '{name}' joined as {role.value}",
        )
        return profile

    def unregister_agent(self, name: str) -> bool:
        """Remove an agent."""
        if name in self._agents:
            self._agents[name].active = False
            return True
        return False

    def send_message(
        self,
        sender: str,
        receiver: str,
        message_type: MessageType,
        content: str,
        data: Optional[Dict[str, Any]] = None,
        reply_to: str = "",
    ) -> AgentMessage:
        """
        Send a message between agents.

        Args:
            sender: Sender agent name.
            receiver: Receiver agent name (empty for broadcast).
            message_type: Type of message.
            content: Message content.
            data: Optional structured data.
            reply_to: ID of message being replied to.

        Returns:
            Sent AgentMessage.
        """
        msg = AgentMessage(
            sender=sender,
            receiver=receiver,
            message_type=message_type,
            content=content,
            data=data or {},
            reply_to=reply_to,
        )
        self._messages.append(msg)
        if len(self._messages) > self.MAX_MESSAGES:
            self._messages = self._messages[-self.MAX_MESSAGES:]

        bus = get_event_bus()
        bus.emit(EventType.AUTONOMOUS_CYCLE, {
            "event": "agent_message",
            "sender": sender,
            "receiver": receiver,
            "type": message_type.value,
        })

        return msg

    def request_task(
        self,
        requester: str,
        task_description: str,
        preferred_role: Optional[AgentRole] = None,
    ) -> Optional[str]:
        """
        Request an agent to handle a task. Auto-assigns based on role and track record.

        Args:
            requester: Name of requesting agent.
            task_description: What needs to be done.
            preferred_role: Preferred role for the assignee.

        Returns:
            Name of assigned agent, or None if no suitable agent found.
        """
        candidates = [
            a for a in self._agents.values()
            if a.active and a.name != requester
        ]

        if preferred_role:
            role_candidates = [
                a for a in candidates if a.role == preferred_role
            ]
            if role_candidates:
                candidates = role_candidates

        if not candidates:
            return None

        # Sort by success rate (best performer first)
        candidates.sort(key=lambda a: a.success_rate, reverse=True)
        assignee = candidates[0]

        self.send_message(
            requester, assignee.name,
            MessageType.TASK_REQUEST,
            task_description,
        )

        return assignee.name

    def submit_review(
        self,
        reviewer: str,
        target: str,
        approved: bool,
        score: float = 0.0,
        feedback: Optional[List[str]] = None,
        suggestions: Optional[List[str]] = None,
    ) -> ReviewResult:
        """
        Submit a peer review.

        Args:
            reviewer: Name of reviewing agent.
            target: What was reviewed (code, plan, etc.).
            approved: Whether the review passes.
            score: Quality score 0.0-1.0.
            feedback: Review comments.
            suggestions: Improvement suggestions.

        Returns:
            ReviewResult.
        """
        review = ReviewResult(
            reviewer=reviewer,
            target=target,
            approved=approved,
            score=max(0.0, min(1.0, score)),
            feedback=feedback or [],
            suggestions=suggestions or [],
        )
        self._reviews.append(review)

        self._broadcast(
            reviewer, MessageType.REVIEW_RESPONSE,
            f"Review of '{target}': {'APPROVED' if approved else 'REJECTED'} "
            f"(score: {score:.1f})",
            {"review_approved": approved, "review_score": score},
        )

        return review

    def start_debate(self, topic: str) -> str:
        """
        Start a multi-agent debate on a topic.

        Args:
            topic: What to debate.

        Returns:
            Debate ID.
        """
        debate_id = uuid.uuid4().hex[:8]
        self._debates[debate_id] = []
        self._broadcast(
            "system", MessageType.STATUS_UPDATE,
            f"Debate started: {topic} (id: {debate_id})",
            {"debate_id": debate_id, "topic": topic},
        )
        return debate_id

    def propose(
        self,
        debate_id: str,
        proposer: str,
        approach: str,
        reasoning: str = "",
        effort: str = "",
    ) -> Optional[DebateProposal]:
        """
        Submit a proposal to a debate.

        Args:
            debate_id: ID of active debate.
            proposer: Agent making the proposal.
            approach: Proposed approach.
            reasoning: Why this approach is good.
            effort: Estimated effort.

        Returns:
            DebateProposal or None if debate not found.
        """
        if debate_id not in self._debates:
            return None

        proposal = DebateProposal(
            proposer=proposer,
            approach=approach,
            reasoning=reasoning,
            estimated_effort=effort,
        )
        self._debates[debate_id].append(proposal)

        self._broadcast(
            proposer, MessageType.PROPOSAL,
            f"Proposal by {proposer}: {approach[:100]}",
            {"debate_id": debate_id, "proposal_id": proposal.id},
        )

        return proposal

    def vote(
        self,
        debate_id: str,
        voter: str,
        proposal_id: str,
        support: bool,
    ) -> bool:
        """
        Vote on a proposal in a debate.

        Args:
            debate_id: Debate ID.
            voter: Voting agent name.
            proposal_id: Proposal to vote on.
            support: True for, False against.

        Returns:
            True if vote recorded.
        """
        if debate_id not in self._debates:
            return False

        for proposal in self._debates[debate_id]:
            if proposal.id == proposal_id:
                if support:
                    if voter not in proposal.votes_for:
                        proposal.votes_for.append(voter)
                else:
                    if voter not in proposal.votes_against:
                        proposal.votes_against.append(voter)
                return True

        return False

    def resolve_debate(self, debate_id: str) -> Optional[DebateProposal]:
        """
        Resolve a debate by selecting the winning proposal.

        Args:
            debate_id: Debate ID.

        Returns:
            Winning DebateProposal or None.
        """
        if debate_id not in self._debates:
            return None

        proposals = self._debates[debate_id]
        if not proposals:
            return None

        # Sort by vote score, then by proposer success rate
        proposals.sort(
            key=lambda p: (
                p.vote_score,
                self._agents.get(p.proposer, AgentProfile(name="")).success_rate,
            ),
            reverse=True,
        )

        winner = proposals[0]
        self._broadcast(
            "system", MessageType.STATUS_UPDATE,
            f"Debate resolved: Winner is {winner.proposer}'s proposal "
            f"(score: {winner.vote_score})",
        )

        return winner

    def assign_roles(
        self, goal: str,
    ) -> Dict[AgentRole, str]:
        """
        Auto-assign roles to agents based on the goal and their track records.

        Args:
            goal: Task goal.

        Returns:
            Dict mapping roles to agent names.
        """
        assignments: Dict[AgentRole, str] = {}
        available = [a for a in self._agents.values() if a.active]

        if not available:
            return assignments

        # Smart assignment: match agents to roles
        needed_roles = [
            AgentRole.PLANNER,
            AgentRole.IMPLEMENTER,
            AgentRole.REVIEWER,
            AgentRole.TESTER,
        ]

        for role in needed_roles:
            # Prefer agents already in this role
            candidates = [a for a in available if a.role == role]
            if not candidates:
                candidates = available

            # Sort by role specialization score
            candidates.sort(
                key=lambda a: a.specializations.get(role.value, 0.0),
                reverse=True,
            )

            if candidates:
                assignments[role] = candidates[0].name

        return assignments

    def update_specialization(
        self,
        agent_name: str,
        task_type: str,
        success: bool,
    ) -> None:
        """
        Update agent specialization scores based on task outcomes.

        Args:
            agent_name: Agent name.
            task_type: Type of task performed.
            success: Whether it succeeded.
        """
        agent = self._agents.get(agent_name)
        if not agent:
            return

        if success:
            agent.success_count += 1
        else:
            agent.failure_count += 1

        # Update specialization score (exponential moving average)
        current = agent.specializations.get(task_type, 0.5)
        result = 1.0 if success else 0.0
        agent.specializations[task_type] = current * 0.8 + result * 0.2

    def get_messages(
        self,
        agent_name: Optional[str] = None,
        limit: int = 20,
    ) -> List[AgentMessage]:
        """Get messages, optionally filtered to an agent."""
        if agent_name:
            msgs = [
                m for m in self._messages
                if m.receiver == agent_name or m.sender == agent_name
                or m.receiver == ""
            ]
        else:
            msgs = list(self._messages)
        return msgs[-limit:]

    def get_stats(self) -> Dict[str, Any]:
        """Return collaboration statistics."""
        active = sum(1 for a in self._agents.values() if a.active)
        return {
            "total_agents": len(self._agents),
            "active_agents": active,
            "total_messages": len(self._messages),
            "total_reviews": len(self._reviews),
            "active_debates": len(self._debates),
            "review_approval_rate": (
                sum(1 for r in self._reviews if r.approved) /
                len(self._reviews) if self._reviews else 0.0
            ),
            "agent_roles": {
                a.name: a.role.value for a in self._agents.values()
            },
        }

    # --- Internal helpers ---

    def _broadcast(
        self,
        sender: str,
        msg_type: MessageType,
        content: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Broadcast message to all agents."""
        self.send_message(sender, "", msg_type, content, data)


__all__ = [
    "AgentRole",
    "AgentMessage",
    "AgentProfile",
    "CollaborationProtocol",
    "DebateProposal",
    "ReviewResult",
    "MessageType",
]
