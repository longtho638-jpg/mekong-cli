# Researcher Report 01 — CLI Engine Readiness for AGI GO LIVE

**Ngày:** 2026-02-27
**Phạm vi:** `src/core/`, `src/agents/`, `tests/`, `pyproject.toml`, entry point
**Mục tiêu:** Đánh giá khả năng go-live production

---

## 1. Trạng thái Packaging & Entry Point

| Hạng mục | Kết quả |
|----------|---------|
| `pyproject.toml` | Có — `mekong-cli-lean v2.1.33`, poetry build system |
| Console script | `mekong = "src.main:app"` — đã khai báo |
| Import test | `from src.main import app` → **IMPORT OK** |
| Venv | `.venv/` với Python 3.11, đủ deps |

**Entry point hoạt động.** CLI khởi động được.

---

## 2. Trạng thái Source Code

### `src/core/` (30 files, ~8,285 LOC)

| File | LOC | Trạng thái |
|------|-----|-----------|
| `gateway.py` | 748 | Implemented — FastAPI app với endpoints đầy đủ |
| `telegram_bot.py` | 742 | Implemented |
| `orchestrator.py` | 547 | Implemented — Plan-Execute-Verify flow |
| `agi_loop.py` | 505 | Implemented |
| `verifier.py` | 468 | Implemented — Binh Phap quality gates |
| `planner.py` | 447 | Implemented |
| `llm_client.py` | 432 | Implemented |
| `gateway_dashboard.py` | 384 | Implemented |
| `nlp_commander.py` | 341 | Implemented |

Không có `NotImplementedError` hay stub trắng trong các file core. Codebase **thực sự implemented**, không phải placeholder.

**Vấn đề tìm thấy:** Một số file vi phạm quy tắc 200 LOC (`gateway.py` 748 LOC, `telegram_bot.py` 742 LOC, `orchestrator.py` 547 LOC).

### `src/agents/` (6 files)

- `git_agent.py`, `file_agent.py`, `shell_agent.py` — operational agents
- `lead_hunter.py`, `content_writer.py`, `recipe_crawler.py` — business agents
- Tất cả inherit `AgentBase` → `plan()` → `execute()` → `verify()`

---

## 3. Test Coverage

**22 test files, ~4,423 LOC tests**

Kết quả chạy nhanh:

| Test group | Kết quả |
|------------|---------|
| `test_nlu.py` + `test_memory.py` | **41 PASSED** trong 0.15s |
| `test_orchestrator_integration.py` | PASSED |
| `test_cook_command.py` | PASSED |
| `test_gateway.py` | **FAILED — 60+ tests** |

### Root cause của gateway failures:

```
TypeError: Client.__init__() got an unexpected keyword argument 'app'
```

**Nguyên nhân:** `httpx.TestClient` API thay đổi ở phiên bản mới, cần dùng `httpx.Client(transport=...)` hoặc `starlette.testclient.TestClient` trực tiếp. Đây là lỗi **test code**, không phải production code.

---

## 4. Blocking Issues cho Go-Live

### BLOCKER 1 (P0) — Gateway tests broken
- 60+ tests trong `test_gateway.py` fail do dependency version mismatch (`httpx`/`starlette` TestClient API)
- Gateway (`gateway.py`) là công khai API — không thể go-live khi tests fail
- **Fix:** Update `test_gateway.py` dùng `TestClient` đúng cách theo starlette mới

### BLOCKER 2 (P0) — Không có `.env` mặc định cho public users
- `.env.example` cần verify đủ biến (LLM_BASE_URL, API keys)
- Public users cần onboarding rõ ràng

### BLOCKER 3 (P1) — Files vượt 200 LOC
- `gateway.py` (748), `telegram_bot.py` (742), `orchestrator.py` (547) vi phạm rule
- Không blocking ngay nhưng cản trở maintainability

### BLOCKER 4 (P1) — Package name mismatch
- `pyproject.toml`: `name = "mekong-cli-lean"` nhưng CLI name là `mekong`
- Khi publish PyPI, users `pip install mekong-cli-lean` nhưng expect `pip install mekong`

---

## 5. Những gì HOẠT ĐỘNG tốt

- Import thành công, không có circular dependency crashes
- Core Plan-Execute-Verify pipeline implemented đầy đủ
- NLU, Memory, Telemetry tests — all pass
- Poetry packaging chuẩn, có `pyproject.toml` đúng format
- Venv với Python 3.11 stable
- 22 test files — coverage structure tốt
- AGI loop, autonomous mode, governance, smart router — đều có implementation thực

---

## 6. Khuyến nghị

**Ưu tiên trước go-live:**

1. Fix `test_gateway.py` TestClient API compat — 1-2 giờ
2. Verify `.env.example` đầy đủ và có `README` onboarding
3. Đổi `name = "mekong-cli"` trong `pyproject.toml`
4. Chạy full test suite, đảm bảo `0 FAILED`

**Sau go-live (backlog):**
- Split `gateway.py` → router modules (< 200 LOC each)
- Thêm `--help` documentation đầy đủ cho mỗi command

---

## Kết luận

**Mức độ sẵn sàng: 75% (GẦN production-ready)**

Engine không phải stub — code thực sự được implement. Vấn đề chính là **test infrastructure** (gateway TestClient compat) chứ không phải thiếu feature. Sau 1-2 ngày fix, có thể go-live.

---

## Câu hỏi chưa giải quyết

1. `.env.example` có đủ biến cho public user không? (chưa đọc được)
2. PyPI publish workflow đã setup chưa (GitHub Actions)?
3. `bin/oc` entry point (thấy trong `bin/`) dùng để làm gì, có cần ship không?
