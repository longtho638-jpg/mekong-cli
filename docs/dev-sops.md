# Developer SOPs — Mekong CLI

Standard Operating Procedures cho contributor và maintainer.

## SOP 1: Setup môi trường dev

```bash
# 1. Clone
git clone https://github.com/mekong-cli/mekong-cli.git && cd mekong-cli

# 2. Python deps
pip install -e ".[dev]"

# 3. Node deps (cho mekong-engine)
pnpm install

# 4. Env vars
cp .env.example .env
# Sửa LLM_API_KEY, LLM_BASE_URL

# 5. Verify
python3 -m pytest tests/ -q          # Python tests
cd packages/mekong-engine && pnpm test # Engine tests
```

## SOP 2: Chạy test suite

```bash
# Full Python test suite (~2.5 phút)
python3 -m pytest tests/ -v

# Chạy 1 test file
python3 -m pytest tests/test_planner.py -v

# Engine tests (Cloudflare Worker)
cd packages/mekong-engine && pnpm test

# Type check engine
cd packages/mekong-engine && pnpm run typecheck
```

**Lưu ý:** Không dùng `--timeout` flag (pytest-timeout chưa install).

## SOP 3: Thêm Agent mới

1. Tạo `src/agents/your_agent.py` (< 200 LOC)
2. Inherit `AgentBase` từ `src/core/agent_base.py`
3. Implement 3 methods: `plan()`, `execute()`, `verify()`
4. Register trong `src/agents/__init__.py` → `AGENT_REGISTRY`
5. Tạo test `tests/test_your_agent.py`
6. Chạy: `python3 -m pytest tests/test_your_agent.py -v`

```python
from src.core.agent_base import AgentBase

class MyAgent(AgentBase):
    name = "my-agent"
    description = "Does something useful"

    def plan(self, goal: str) -> list:
        return [{"action": "execute", "params": {"command": "echo hello"}}]

    def execute(self, plan: list) -> dict:
        # Run the plan steps
        return {"status": "success", "output": "hello"}

    def verify(self, result: dict) -> bool:
        return result.get("status") == "success"
```

## SOP 4: Sửa PEV Engine (core)

| File | Chức năng |
|------|-----------|
| `src/core/planner.py` | LLM goal decomposition |
| `src/core/executor.py` | Shell/LLM/API runner |
| `src/core/verifier.py` | Result validation |
| `src/core/orchestrator.py` | PEV coordination + rollback |
| `src/core/llm_client.py` | OpenAI-compatible client |
| `src/core/exceptions.py` | MekongError hierarchy |

**Quy trình:**
1. Đọc code hiện tại, hiểu flow
2. Sửa code, giữ < 200 LOC/file
3. Thêm type hints cho mọi function
4. Chạy `python3 -m pytest tests/ -v`
5. Commit theo convention: `fix(core): mô tả ngắn`

## SOP 5: Mekong Engine (Cloudflare Worker)

```bash
cd packages/mekong-engine

# Dev local
pnpm run dev                    # http://localhost:8787

# Deploy
pnpm run deploy                 # Cloudflare Workers

# Thêm route mới
# 1. Tạo src/routes/your-route.ts
# 2. Import + register trong src/index.ts
# 3. Thêm test trong test/
# 4. Type check: pnpm run typecheck

# Thêm migration
# 1. Tạo migrations/000X_name.sql
# 2. Local: pnpm run db:migrate
# 3. Prod: pnpm run db:migrate:prod

# Secrets
pnpm exec wrangler secret put SERVICE_TOKEN
pnpm exec wrangler secret put LLM_API_KEY
```

## SOP 6: Git workflow

```bash
# Branch naming
git checkout -b feat/add-database-agent
git checkout -b fix/planner-timeout-bug

# Commit convention
feat: [module] - Add new feature
fix: [module] - Fix bug
refactor: [module] - Code improvement
test: [module] - Add/update tests
docs: Update documentation

# Pre-push checklist
python3 -m pytest tests/ -v          # ✅ All pass
grep -r ": any" src/ --include="*.ts" | wc -l  # ✅ = 0
grep -r "API_KEY\|SECRET" src/ --include="*.py" | grep -v "os.environ\|getenv" | wc -l  # ✅ = 0

# PR
gh pr create --title "feat(agents): add database agent" --body "..."
```

## SOP 7: Debug issues

```bash
# Check LLM connectivity
python3 -c "from src.core.llm_client import LLMClient; c = LLMClient(); print(c.health())"

# Check API gateway
curl http://localhost:8000/health

# Check engine
curl https://mekong-engine.agencyos-openclaw.workers.dev/health

# Run single test with verbose
python3 -m pytest tests/test_executor.py::test_shell_execution -v -s
```

## SOP 8: Project structure cheat sheet

```
mekong-cli/
├── src/
│   ├── core/           # PEV engine (planner, executor, verifier, orchestrator)
│   ├── agents/         # Pluggable agents (git, file, shell, lead, content)
│   ├── api/            # FastAPI gateway + RaaS middleware
│   ├── binh_phap/      # Quality standards engine
│   ├── config.py       # Global config (env vars)
│   └── main.py         # CLI entry point (Typer + Rich)
├── packages/
│   └── mekong-engine/  # Cloudflare Worker (Hono + D1 + Workers AI)
├── tests/              # Python test suite (62 tests)
├── docs/               # Documentation
├── .env.example        # Env template
├── CONTRIBUTING.md     # Contributor guide + revenue sharing
└── README.md           # Project overview
```

## SOP 9: CI/CD pipeline

| Check | Tool | Trigger |
|-------|------|---------|
| Python tests | pytest | Push to master |
| Engine typecheck | tsc --noEmit | Push to master |
| Engine tests | vitest | Push to master |
| Engine deploy | wrangler deploy | CI success on master |

**Nếu CI fail:**
1. Đọc logs: `gh run view --log-failed`
2. Fix locally, push lại
3. Không merge khi CI đỏ

## SOP 10: Security checklist

- [ ] Không commit `.env`, `.dev.vars`, API keys
- [ ] Không hardcode secrets trong source code
- [ ] Dùng `os.environ` / `c.env` cho env vars
- [ ] Input validation với Pydantic (Python) / Zod (TS)
- [ ] CORS configured trên API endpoints
- [ ] Webhook auth với secret-based verification
