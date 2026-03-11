# New Contributor Welcome Kit — Mekong CLI

**Welcome to the Mekong river. Let's build something that flows.**

---

## Quick Start (< 10 minutes)

```bash
# 1. Fork the repo
gh repo fork longtho638-jpg/mekong-cli --clone

# 2. Set up environment
cd mekong-cli
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# 3. Set your LLM
export LLM_BASE_URL=https://openrouter.ai/api/v1
export LLM_API_KEY=your-key
export LLM_MODEL=anthropic/claude-sonnet-4

# 4. Run tests
python3 -m pytest tests/ -v

# 5. Try a command
mekong ask "what commands are available?"
```

If anything breaks in those 5 steps, **open an issue immediately** — a broken setup = lost contributor.

---

## Your First PR

### Find Something to Work On

| Label | What It Means | Good For |
|-------|--------------|----------|
| `good first issue` | Self-contained, clear scope | First-timers |
| `help wanted` | We want external input | Experienced contributors |
| `bug` | Confirmed defect | Debuggers |
| `docs` | Documentation gap | Writers |
| `command-request` | New command idea | Power users |

Browse: `github.com/longtho638-jpg/mekong-cli/issues?q=label%3A"good+first+issue"`

### PR Rules

1. **One PR = one thing.** Don't bundle unrelated changes.
2. **Tests required.** Every new command needs a test in `tests/`.
3. **No AI refs in commits.** Write commit messages like a human.
4. **Under 200 lines per file.** Split if larger (project standard).
5. **Pass CI before asking for review.** `pytest` must be green.

### PR Template

```markdown
## What
[One sentence: what does this change do?]

## Why
[One sentence: why is this change needed?]

## How
[Brief: how did you implement it?]

## Test
[How to verify it works]
```

---

## Community Norms

**We follow the Binh Phap code:**
- Plan before building (open an issue, discuss approach first for large changes)
- Execute with precision (clean code, tests, documentation)
- Verify before claiming done (CI green, manual test run)

**Tone:** Direct, technical, respectful. No gatekeeping. No "that's a dumb idea."

**Language:** English in code and PRs. Vietnamese in comments between Vietnamese speakers is fine.

---

## What We're Building

Mekong CLI is an AI-operated business platform. Five layers:

```
👑 Founder    — Strategic commands (/annual, /okr, /swot)
🏢 Business   — Revenue operations (/sales, /marketing, /finance)
📦 Product    — Product development (/plan, /sprint, /roadmap)
⚙️ Engineer   — Code execution (/cook, /fix, /deploy, /review)
🔧 Ops        — Operations (/audit, /health, /security)
```

Every contribution makes a solo founder more powerful.

---

## Communication Channels

| Channel | Use |
|---------|-----|
| GitHub Issues | Bug reports, feature requests, questions |
| GitHub Discussions | Architecture decisions, ideas |
| Discord #contributors | Real-time chat (link in README) |
| PRs | Code review and feedback |

**Response time:** Issues reviewed within 48hrs. PRs reviewed within 72hrs.

---

## Recognition

- All contributors listed in `CONTRIBUTORS.md`
- Significant contributors get `contributor` role in Discord
- Top contributors (5+ merged PRs) get free Pro subscription
- All merged PRs credited in release notes
