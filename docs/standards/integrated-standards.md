# Integrated Development Standards

This document consolidates .claude and VIBE development standards.

## Core Principles (VIBE)

### The Trinity
1. **YAGNI** (You Aren't Gonna Need It): Không code thừa
2. **KISS** (Keep It Simple, Stupid): Đơn giản nhất có thể  
3. **DRY** (Don't Repeat Yourself): Không lặp lại

### VIBE Workflow Process
1. **Detection**: Xác định kế hoạch
2. **Analysis**: Phân tích task
3. **Implementation**: Viết code
4. **Testing**: Chạy tests (100% pass required)
5. **Review**: Tự đánh giá
6. **Finalize**: Commit và update docs

## File Standards
- Naming: `kebab-case` (e.g., `revenue-engine.py`)
- Max lines: 250 lines per file
- Plans: Located in `plans/{date}-{slug}/`
- Commits: Conventional commits format

## Security & Privacy
- Never commit secrets, API keys, passwords
- Use mock data for testing
- Follow security best practices

## Integration Compliance
1. Both systems must recognize the same standards
2. Documentation must stay synchronized
3. Workflows must be compatible
4. Quality gates must be enforced

---

🏯 Victory comes from preparation
