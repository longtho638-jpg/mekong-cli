"""Founder Pitch — /founder pitch backend.

AI investor simulation: investor personas (YC/VC/Angel), pitch session
with standard + curveball questions, brutal feedback, multi-round iteration.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

logger = logging.getLogger(__name__)

InvestorType = Literal["yc", "vc", "angel"]
PitchResult = Literal["INVEST", "PASS", "MAYBE"]


# ── Data Models ──────────────────────────────────────────────────────


@dataclass
class InvestorPersona:
    """AI investor persona configuration."""

    type: InvestorType
    name: str
    philosophy: str
    red_flags: list[str]
    green_flags: list[str]
    style: str


@dataclass
class PitchQuestion:
    """A question asked during pitch session."""

    id: int
    question: str
    look_for: str
    category: str = "standard"  # standard | curveball


@dataclass
class AnswerFeedback:
    """Feedback on a specific answer."""

    question: str
    answer: str
    problem: str
    suggested_better: str
    score: int  # 1-10


@dataclass
class SlideFeedback:
    """Feedback on a specific deck slide."""

    slide: str
    feedback: str
    score: int  # 1-10


@dataclass
class PitchFeedback:
    """Complete pitch session feedback."""

    round_number: int
    investor_type: InvestorType
    result: PitchResult
    overall_score: int  # 1-10
    what_worked: list[str]
    fatal_issue: str
    fixable_issues: list[str]
    slide_feedback: list[SlideFeedback]
    answer_feedback: list[AnswerFeedback]
    specific_rewrites: list[str]


@dataclass
class PitchSession:
    """A complete pitch practice session."""

    date: str
    investor_type: InvestorType
    rounds: list[PitchFeedback]
    key_weaknesses: list[str] = field(default_factory=list)
    strongest_moments: list[str] = field(default_factory=list)

    @property
    def score_trend(self) -> list[int]:
        return [r.overall_score for r in self.rounds]


# ── Investor Personas ────────────────────────────────────────────────

INVESTOR_PERSONAS: dict[InvestorType, InvestorPersona] = {
    "yc": InvestorPersona(
        type="yc",
        name="YC Partner (Michael Seibel style)",
        philosophy="Do Things That Don't Scale, ramen profitable, real traction",
        red_flags=[
            "vanity metrics",
            "no revenue",
            "we'll monetize later",
            "huge TAM slide with no bottoms-up",
        ],
        green_flags=[
            "growth rate",
            "retention",
            "founder-market fit",
            "paying customers",
        ],
        style="Direct, fast, no softening",
    ),
    "vc": InvestorPersona(
        type="vc",
        name="Series A VC (a16z style)",
        philosophy="Large market, network effects, strong team, 10x potential",
        red_flags=[
            "small market",
            "no moat",
            "solo founder doing everything",
            "no clear GTM",
        ],
        green_flags=[
            "10x potential",
            "defensible position",
            "clear GTM",
            "strong team",
        ],
        style="Sophisticated, pattern-matching",
    ),
    "angel": InvestorPersona(
        type="angel",
        name="Founder-turned-angel",
        philosophy="Bet on founder, founder-market fit, early traction",
        red_flags=[
            "doesn't know numbers",
            "no customers yet",
            "unfocused vision",
        ],
        green_flags=[
            "obsession",
            "unfair advantage",
            "paying customers",
            "domain expertise",
        ],
        style="Mentor-like but honest",
    ),
}


def get_investor_persona(investor_type: InvestorType) -> InvestorPersona:
    """Get investor persona by type."""
    persona = INVESTOR_PERSONAS.get(investor_type)
    if not persona:
        raise ValueError(f"Unknown investor type: {investor_type}")
    return persona


# ── Questions ────────────────────────────────────────────────────────

STANDARD_QUESTIONS: list[PitchQuestion] = [
    PitchQuestion(1, "What does your company do? (30 seconds)",
                  "clarity, no jargon"),
    PitchQuestion(2, "What's your traction?",
                  "real numbers, growth rate"),
    PitchQuestion(3, "Why is now the right time for this?",
                  "market timing insight"),
    PitchQuestion(4, "Why are you the right team?",
                  "unfair advantage, domain expertise"),
    PitchQuestion(5, "What's your revenue model?",
                  "CAC, LTV, payback period"),
    PitchQuestion(6, "Who are your competitors? Why will you win?",
                  "honest competitive analysis"),
    PitchQuestion(7, "What are you most worried about?",
                  "self-awareness, intellectual honesty"),
    PitchQuestion(8, "What do you need beyond money?",
                  "specific asks, not just mentorship"),
    PitchQuestion(9, "What's your biggest assumption that could be wrong?",
                  "risk awareness"),
    PitchQuestion(10, "If you don't raise this round, what happens?",
                   "bootstrappability, burn discipline"),
]

CURVEBALL_QUESTIONS: list[PitchQuestion] = [
    PitchQuestion(11, "Your competitor just raised $50M. How do you win?",
                  "strategic thinking under pressure", "curveball"),
    PitchQuestion(12, "Why wouldn't I just build this myself in 6 months?",
                  "moat articulation", "curveball"),
    PitchQuestion(13, "You're a solo founder. That's a risk. Convince me.",
                  "self-awareness + strength framing", "curveball"),
    PitchQuestion(14, "What have you been wrong about in the last 6 months?",
                  "intellectual honesty, learning ability", "curveball"),
    PitchQuestion(15, "Quote your best customer. What do they say about you?",
                  "customer intimacy", "curveball"),
]


def get_session_questions(
    include_curveballs: int = 3,
) -> list[PitchQuestion]:
    """Get questions for a pitch session."""
    questions = list(STANDARD_QUESTIONS)
    # Add subset of curveballs
    curveballs = CURVEBALL_QUESTIONS[:min(include_curveballs, len(CURVEBALL_QUESTIONS))]
    questions.extend(curveballs)
    return questions


# ── Feedback Generation ──────────────────────────────────────────────


def evaluate_pitch(
    round_number: int,
    investor_type: InvestorType,
    answers: dict[int, str],
    deck_slides: dict[str, str] | None = None,
) -> PitchFeedback:
    """Evaluate a pitch round and generate structured feedback.

    In production, this calls LLM for deep analysis.
    Here we generate structured feedback based on answer quality heuristics.
    """
    # Validate investor type exists
    get_investor_persona(investor_type)

    # Score answers based on length and specificity
    answer_scores: list[AnswerFeedback] = []
    total_score = 0
    questions = {q.id: q for q in STANDARD_QUESTIONS + CURVEBALL_QUESTIONS}

    for qid, answer in answers.items():
        q = questions.get(qid)
        if not q:
            continue

        # Simple heuristic: longer, specific answers score higher
        score = min(10, max(1, len(answer) // 20 + 3))
        if any(w in answer.lower() for w in ["revenue", "$", "growth", "customers"]):
            score = min(10, score + 2)
        if any(w in answer.lower() for w in ["maybe", "hopefully", "we think"]):
            score = max(1, score - 2)

        total_score += score
        answer_scores.append(AnswerFeedback(
            question=q.question,
            answer=answer[:100],
            problem="Too vague" if score < 5 else "Could be sharper",
            suggested_better=f"Add specific numbers for: {q.look_for}",
            score=score,
        ))

    avg_score = total_score // max(1, len(answer_scores))

    # Determine result
    if avg_score >= 8:
        result: PitchResult = "INVEST"
    elif avg_score >= 5:
        result = "MAYBE"
    else:
        result = "PASS"

    # Slide feedback
    slide_fb: list[SlideFeedback] = []
    if deck_slides:
        for slide_name, content in deck_slides.items():
            s_score = min(10, max(1, len(content) // 30 + 3))
            slide_fb.append(SlideFeedback(
                slide=slide_name,
                feedback="Content length ok" if s_score >= 5 else "Needs more detail",
                score=s_score,
            ))

    # Build feedback
    what_worked = [
        fb.question for fb in answer_scores if fb.score >= 7
    ][:3]
    fixable = [
        f"Q: {fb.question} — {fb.problem}"
        for fb in answer_scores if fb.score < 5
    ]

    return PitchFeedback(
        round_number=round_number,
        investor_type=investor_type,
        result=result,
        overall_score=avg_score,
        what_worked=what_worked if what_worked else ["Showed up and pitched"],
        fatal_issue="No fatal issues" if result != "PASS" else fixable[0] if fixable else "Overall weak",
        fixable_issues=fixable[:3],
        slide_feedback=slide_fb,
        answer_feedback=answer_scores,
        specific_rewrites=[
            f"Improve answer to: {fb.question}" for fb in answer_scores if fb.score < 6
        ][:3],
    )


# ── Session Management ───────────────────────────────────────────────


def create_session(investor_type: InvestorType) -> PitchSession:
    """Create a new pitch practice session."""
    return PitchSession(
        date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        investor_type=investor_type,
        rounds=[],
    )


def add_round(
    session: PitchSession,
    feedback: PitchFeedback,
) -> PitchSession:
    """Add a round's feedback to the session."""
    session.rounds.append(feedback)

    # Update session-level insights
    all_fixable = []
    all_worked = []
    for r in session.rounds:
        all_fixable.extend(r.fixable_issues)
        all_worked.extend(r.what_worked)

    session.key_weaknesses = list(set(all_fixable))[:5]
    session.strongest_moments = list(set(all_worked))[:3]

    return session


# ── File I/O ─────────────────────────────────────────────────────────


def save_session(base_dir: str, session: PitchSession) -> str:
    """Save pitch session to .mekong/raise/pitch-sessions/."""
    sessions_dir = Path(base_dir) / ".mekong" / "raise" / "pitch-sessions"
    sessions_dir.mkdir(parents=True, exist_ok=True)

    path = sessions_dir / f"session-{session.date}.json"
    path.write_text(json.dumps(asdict(session), indent=2, ensure_ascii=False))
    return str(path)


def load_session(base_dir: str, date: str) -> PitchSession | None:
    """Load a pitch session by date."""
    path = Path(base_dir) / ".mekong" / "raise" / "pitch-sessions" / f"session-{date}.json"
    if not path.exists():
        return None

    data = json.loads(path.read_text())
    rounds = [
        PitchFeedback(
            round_number=r["round_number"],
            investor_type=r["investor_type"],
            result=r["result"],
            overall_score=r["overall_score"],
            what_worked=r["what_worked"],
            fatal_issue=r["fatal_issue"],
            fixable_issues=r["fixable_issues"],
            slide_feedback=[SlideFeedback(**s) for s in r["slide_feedback"]],
            answer_feedback=[AnswerFeedback(**a) for a in r["answer_feedback"]],
            specific_rewrites=r["specific_rewrites"],
        )
        for r in data["rounds"]
    ]
    return PitchSession(
        date=data["date"],
        investor_type=data["investor_type"],
        rounds=rounds,
        key_weaknesses=data.get("key_weaknesses", []),
        strongest_moments=data.get("strongest_moments", []),
    )
