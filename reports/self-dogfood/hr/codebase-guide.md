# Codebase Learning Guide — Mekong CLI

**For:** Anyone wanting to understand Mekong CLI deeply | **Time:** 2–4 hours

---

## Start Here: The Mental Model

Mekong CLI is not a chatbot wrapper. It is an **execution engine** with a command vocabulary.

```
You type:    mekong cook "write a sales email"
It does:     Plan the task → Execute each step → Verify the result
You get:     A complete, verified output + N MCU deducted
```

Three concepts unlock everything:
1. **PEV loop** — how every command runs
2. **Command contracts** — what each command can do
3. **LLM adapter** — how we stay provider-agnostic

---

## Module Map

### Core Engine (`src/core/`)

| Module | Lines | Purpose | Read Order |
|--------|-------|---------|-----------|
| `llm_client.py` | ~120 | Universal LLM router (3 env vars → any provider) | 1st |
| `planner.py` | ~150 | Decomposes user input into executable steps | 2nd |
| `executor.py` | ~180 | Runs each step (shell commands, LLM calls, API calls) | 3rd |
| `verifier.py` | ~100 | Checks output quality, triggers rollback if needed | 4th |
| `orchestrator.py` | ~90 | Coordinates P→E→V loop, handles MCU deduction | 5th |

**Read these 5 files in order. You'll understand 80% of the system.**

### Agents (`src/agents/`)

Specialized workers called by the executor:

| Agent | Purpose |
|-------|---------|
| `git_agent.py` | Git operations (commit, branch, PR creation) |
| `file_agent.py` | File read/write/search operations |
| `shell_agent.py` | Safe shell command execution with sandboxing |
| `lead_hunter.py` | LinkedIn/web scraping for sales commands |

### API Layer (`src/api/`)

FastAPI server for the dashboard (`agencyos.network`):

| Module | Purpose |
|--------|---------|
| `routes.py` | `/v1/missions` endpoint — receives commands from dashboard |
| `auth.py` | API key validation, rate limiting |
| `billing.py` | MCU credit ledger — deduct after success, not before |

### Command System (`.claude/commands/`)

Each `.md` file is a command definition. Structure:
```markdown
# Command Name
## Purpose
## Input schema
## Steps
## MCU cost
## Example
```

176 commands total. To add a new command: create a `.md` file here + matching `factory/contracts/[name].json`.

### Skills (`.claude/skills/`)

542 skill definitions. Skills are reusable sub-routines that commands can invoke.
Example: `cook` command uses the `code-writer` skill + `test-runner` skill + `git-commit` skill.

---

## Key Patterns

### Pattern 1: Adding a New Command

```bash
# 1. Create command definition
touch .claude/commands/my-command.md

# 2. Create JSON contract
touch factory/contracts/my-command.json

# 3. Register in command registry
# Edit src/core/orchestrator.py → COMMAND_REGISTRY dict

# 4. Add tests
touch tests/test_my_command.py

# 5. Test it
mekong my-command "test input"
```

### Pattern 2: LLM Call

```python
from src.core.llm_client import LLMClient

client = LLMClient()  # reads LLM_BASE_URL, LLM_API_KEY, LLM_MODEL from env
response = await client.complete(
    system="You are a business strategist.",
    user="Write a one-page business plan for an AI CLI tool.",
    max_tokens=2000
)
```

### Pattern 3: MCU Deduction

```python
# In orchestrator.py — deduct ONLY after successful verification
if verifier.passed:
    await billing.deduct(user_id=user.id, mcu_cost=command.mcu_cost)
else:
    # No charge — mission failed
    raise MissionFailedError(verifier.reason)
```

---

## Testing Strategy

```
tests/
├── test_core/
│   ├── test_llm_client.py      # Mock LLM responses
│   ├── test_planner.py         # Plan generation
│   ├── test_executor.py        # Step execution
│   └── test_verifier.py        # Quality gates
├── test_agents/
│   └── test_shell_agent.py     # Sandboxed shell execution
├── test_api/
│   └── test_billing.py         # Credit ledger accuracy
└── test_commands/
    └── test_cook.py            # End-to-end command test
```

**Run all tests:** `python3 -m pytest tests/ -v`
**Run with coverage:** `python3 -m pytest tests/ --cov=src --cov-report=term-missing`
**Target coverage:** > 80%

---

## Common Gotchas

| Gotcha | Explanation | Fix |
|--------|-------------|-----|
| `LLM_API_KEY not set` | .env not loaded | `source .env` or use python-dotenv |
| MCU deducted on failure | Bug in billing order | Always verify before deducting |
| Command not found | Not in COMMAND_REGISTRY | Register in orchestrator.py |
| Shell agent timeout | Default 30s too short | Increase timeout in shell_agent config |
| Provider 401 error | Wrong API key format | Check provider docs for key prefix |

---

## Architecture Decision Records

Key decisions and why they were made:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM provider | Universal adapter | Avoid lock-in, user owns their stack |
| Billing | Credits (MCU) | Aligns cost with value, natural upgrade path |
| Deploy | CF Pages + Fly.io | Zero cost at launch scale |
| Language | Python | Best LLM ecosystem, familiar to AI devs |
| Command format | Markdown + JSON | Human-readable + machine-executable |
| Payment | Polar.sh only | No PayPal (project rule), OSS-friendly |

---

## Where to Go Deep

| Topic | Best Resource |
|-------|--------------|
| PEV loop design | `src/core/orchestrator.py` + comments |
| Command vocabulary | `.claude/commands/` (read 10 random ones) |
| Binh Phap philosophy | `CLAUDE.md` + `docs/` |
| Billing model | `src/api/billing.py` + `reports/self-dogfood/business/revenue.md` |
| Infrastructure | `mekong/infra/scaffold.sh` |
| LLM providers | `mekong/adapters/llm-providers.yaml` |
