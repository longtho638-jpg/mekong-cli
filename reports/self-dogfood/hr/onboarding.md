# Contributor Onboarding Guide
*Mekong CLI v5.0 | Open Source | March 2026*

## Welcome

You found Mekong CLI. Maybe you used it for something, hit a rough edge, and thought "I can fix this." That instinct is exactly why open source works.

This guide gets you from zero to merged PR in under an hour.

---

## Day 0: Environment Setup (15 minutes)

### Prerequisites
- Python 3.9–3.12
- Git
- A terminal (obviously)

### Setup Steps

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/mekong-cli
cd mekong-cli

# 2. Install with dev dependencies
pip install -e ".[dev]"
# Or with Poetry:
poetry install

# 3. Copy environment config
cp .env.example .env
# Add your LLM API key to .env (any provider works)

# 4. Run tests to confirm setup
python3 -m pytest tests/ -q --ignore=tests/e2e --ignore=tests/integration
# Should see tests collected and passing

# 5. Run the CLI
mekong --help
mekong company/init  # Follow the prompts
```

**If setup fails:** Open a GitHub Issue with your OS, Python version, and error output. Response within 24 hours.

---

## Day 0: Codebase Orientation (20 minutes)

### Where Things Live

| Directory | What's in it |
|-----------|-------------|
| `src/core/` | PEV engine: planner, executor, verifier, orchestrator |
| `src/raas/` | Billing, credits, missions, webhooks |
| `src/cli/` | CLI command implementations (Typer-based) |
| `src/agents/` | Agent implementations |
| `src/security/` | Command sanitizer, attestation |
| `.claude/commands/` | 273 command definitions (markdown) |
| `.claude/skills/` | 542 skill definitions (markdown) |
| `tests/` | 206 test files, 3,637 tests |
| `factory/contracts/` | 176 JSON machine contracts |
| `docs/` | Architecture and code standards |

### The PEV Loop (Core Concept)

Every `mekong cook` command runs through:
```
User input → Planner (src/core/planner.py)
           → Executor (src/core/executor.py)
           → Verifier (src/core/verifier.py)
           → Orchestrator coordinates all three
```

Read `src/core/orchestrator.py` first. It's large (1,022 lines — on the refactor list) but explains the whole system.

### Command Anatomy

A command like `mekong finance` maps to:
1. `.claude/commands/finance.md` — the workflow definition
2. `src/cli/` — the Typer CLI handler
3. `src/core/planner.py` — breaks it into sub-tasks
4. LLM call → structured output → file write or API call

---

## Your First Contribution

### Step 1: Find something to work on

**Option A:** Pick a `good-first-issue` label on GitHub
**Option B:** Fix something you noticed while using the tool
**Option C:** Improve a command definition in `.claude/commands/`

Command definitions (`.claude/commands/*.md`) are the easiest entry point — they're markdown, not Python.

### Step 2: Branch naming

```bash
git checkout -b fix/issue-123-describe-the-fix
# or
git checkout -b feat/add-new-command-name
```

Format: `fix/`, `feat/`, `docs/`, `refactor/`, `test/`, `chore/`

### Step 3: Make your change

- Keep files under 200 lines (split if needed)
- Add/update tests for any Python changes
- Follow existing patterns in the file you're editing
- Use `structlog` for logging, not `print()`

### Step 4: Test before pushing

```bash
# Run relevant tests
python3 -m pytest tests/ -q -k "test_name_pattern"

# Type check (if you changed type annotations)
python3 -m mypy src/your_file.py

# Lint
python3 -m ruff check src/your_file.py
```

### Step 5: Commit with sign-off

```bash
git add src/your_file.py tests/your_test.py
git commit -s -m "fix: describe what you fixed and why"
# The -s flag adds: Signed-off-by: Your Name <email>
# This is required (DCO)
```

### Step 6: Open a PR

- Title: match commit format (`fix:`, `feat:`, etc.)
- Description: what changed, why, how to test it
- Link to the issue it closes: `Closes #123`
- Keep PRs small and focused — one concern per PR

---

## Code Standards (Quick Reference)

| Rule | Detail |
|------|--------|
| File size | < 200 lines |
| Type hints | Required for all function signatures |
| Docstrings | Every public class and method |
| Logging | `structlog` only — no `print()` |
| Secrets | Never in code — `.env` only |
| Commits | Conventional format + DCO sign-off |
| Tests | Required for all new Python logic |

Full standards: `docs/code-standards.md`

---

## Getting Help

| Channel | For |
|---------|-----|
| GitHub Issues | Bugs, feature requests |
| GitHub Discussions | Questions, architecture ideas |
| Discord `#dev-contributors` | Real-time help during development |
| Discord `#good-first-issues` | Finding your first task |

We aim to review all PRs within 72 hours. Complex PRs may take longer — we'll leave a comment so you know it's not forgotten.

---

## Contributor Recognition

Every contributor gets:
- Credit in CHANGELOG.md
- `contributor` role in Discord
- Mention in relevant release notes

Repeat contributors (5+ merged PRs) get:
- Listed in README contributors section
- Early access to new features
- Direct Discord channel with maintainers

Thank you for making Mekong better.
