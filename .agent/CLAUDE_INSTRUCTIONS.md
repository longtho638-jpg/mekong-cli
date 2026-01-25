# 🤖 CLAUDE CODE CLI - Perfect Execution Instructions

> **ATTENTION CLAUDE:** Read this entire document before executing ANY code.

---

## 🎯 Project Summary

**Objective:** Complete CC CLI vNext with 100% quality score.

**Current State:**

- 4 CLIs exist and work (cc_revenue, cc_agent, cc_devops, cc_release)
- Missing: cc_client.py, unified entry update, GitHub CI/CD, tests

**Target State:**

- 5 fully working CLIs
- Unified `cc` entry point dispatches to all modules
- GitHub Actions CI/CD workflow
- Performance benchmarks passing
- All tests green

---

## 📚 Required Reading (BEFORE coding)

1. **Read** `/implementation_plan.md` - Architecture blueprint
2. **Read** `/task.md` - Atomic task list with Done criteria
3. **Review** Existing CLIs for patterns:
    - `scripts/cc_revenue.py` (Typer pattern)
    - `scripts/cc_agent.py` (argparse pattern)

---

## ⚖️ Code Rules (MANDATORY)

### 1. No Placeholders

```python
# ❌ WRONG
def create_invoice():
    # TODO: implement later
    pass

# ✅ CORRECT
def create_invoice(client_id: str, amount: float) -> Invoice:
    invoice = Invoice(
        id=str(uuid.uuid4()),
        client_id=client_id,
        amount=amount,
        created_at=datetime.now()
    )
    save_invoice(invoice)
    return invoice
```

### 2. Full Error Handling

```python
# ❌ WRONG
def load_clients():
    return json.load(open("clients.json"))

# ✅ CORRECT
def load_clients() -> List[Client]:
    try:
        with open(CLIENTS_FILE, "r") as f:
            data = json.load(f)
            return [Client(**c) for c in data]
    except FileNotFoundError:
        return []
    except json.JSONDecodeError as e:
        console.print(f"[red]Error: Invalid JSON - {e}[/red]")
        return []
```

### 3. Type Hints Always

```python
# ❌ WRONG
def add_client(name, email):
    ...

# ✅ CORRECT
def add_client(name: str, email: str) -> Client:
    ...
```

### 4. Test Before Implementation

For each new function:

1. Write the test first
2. Run test (should fail)
3. Implement function
4. Run test (should pass)

---

## 📋 Execution Order

Execute tasks in this exact order:

### Phase 1: Core (Tasks 1-3)

```bash
# Task 1: Create cc_client.py
# Task 2: Update unified entry (scripts/cc)
# Task 3: Create .github/workflows/cc-cli.yml
```

### Phase 2: Testing (Tasks 4-6)

```bash
# Task 4: Create tests/test_cc_client.py
# Task 5: Create tests/benchmark_cli.py
# Task 6: Run pytest
pytest tests/test_cc_*.py -v
```

### Phase 3: Validation (Tasks 7-9)

```bash
# Task 7: Test all CLIs manually
./scripts/cc revenue --help
./scripts/cc agent --help
./scripts/cc devops --help
./scripts/cc client --help
./scripts/cc release --help

# Task 8: Lint
ruff check scripts/cc_*.py

# Task 9: Commit
git add . && git commit -m "feat: CC CLI vNext complete"
```

### Phase 4: Documentation (Tasks 10-12)

```bash
# Task 10: Create docs/CC_CLI_GUIDE.md
# Task 11: Update walkthrough
# Task 12: Generate final report
```

---

## 🎬 Finish Protocol

After ALL tasks complete, execute:

```bash
# 1. Verify all CLIs work
./scripts/cc --version
./scripts/cc --help

# 2. Run full test suite
pytest tests/test_cc_*.py -v --tb=short

# 3. Show benchmark
python tests/benchmark_cli.py

# 4. Report to user
echo "=== PERFECT EXECUTION COMPLETE ==="
echo "CLIs: 5/5 working"
echo "Tests: X passed"
echo "Benchmark: All <200ms"
```

---

## 🚫 What NOT To Do

1. ❌ Skip reading implementation_plan.md
2. ❌ Use placeholder comments (# TODO, # FIXME)
3. ❌ Skip error handling
4. ❌ Skip type hints
5. ❌ Commit without running tests
6. ❌ Ask user for clarification (all info is here)

---

## ✅ Quality Checklist

Before reporting completion, verify:

- [ ] `scripts/cc_client.py` exists and works
- [ ] `./scripts/cc client list` works
- [ ] `./scripts/cc --help` shows 5 modules
- [ ] `.github/workflows/cc-cli.yml` valid YAML
- [ ] `tests/test_cc_client.py` exists
- [ ] `tests/benchmark_cli.py` exists
- [ ] `pytest tests/test_cc_*.py` all green
- [ ] `ruff check scripts/cc_*.py` no errors
- [ ] Git commit successful

---

## 🏆 Success Criteria

**100/100 Score Achieved When:**

- All 12 tasks complete ✅
- All CLIs respond to --help ✅
- All tests pass ✅
- All benchmarks under 200ms ✅
- Code committed and pushed ✅

---

**BEGIN EXECUTION NOW.**
