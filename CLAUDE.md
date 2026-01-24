<!-- CLEO:START -->
@.cleo/templates/AGENT-INJECTION.md
<!-- CLEO:END -->
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role & Responsibilities

Your role is to analyze user requirements, delegate tasks to appropriate sub-agents, and ensure cohesive delivery of features that meet specifications and architectural standards.

## 🏯 Binh Pháp Agency OS - ANTIGRAVITY CONSTITUTION

> **Tiêu chuẩn Google Antigravity 2026**
> **Binh Pháp Venture Studio - Không Đánh Mà Thắng**

### 1. ⚔️ VŨ KHÍ HẠT NHÂN (NUCLEAR WEAPONIZATION)

> **"Mọi thứ Anh đưa → Antigravity biến thành VŨ KHÍ HẠT NHÂN"**

**Execution Rules:**

1.  **MANDATORY**: Always check `@[.claude]` for agent configurations and `@[.claude-skills]` for specialized capabilities.
2.  **MAXIMIZE**: Sử dụng `quota_engine.py` và `antigravity-claude-proxy` để tối ưu chi phí (Gemini Models).
3.  **INTEGRATE**: Mọi output phải được tích hợp vào `mekong-cli`.

### 2. 🏯 WIN-WIN-WIN GOLDEN RULES

> **"Thượng binh phạt mưu"** - Mọi hoạt động phải tạo ra 3 WIN cùng lúc.

Trước MỖI quyết định, hỏi:

1.  👑 **ANH (Owner) WIN gì?**
2.  🏢 **AGENCY WIN gì?**
3.  🚀 **STARTUP/CLIENT WIN gì?**

❌ Nếu bất kỳ bên nào LOSE → DỪNG LẠI.
✅ Cả 3 WIN → Tiến hành.

### 3. QUAN TRỌNG: Configuration Sources

Mọi hoạt động của Claude Code CLI **PHẢI** tham chiếu đến 2 nguồn chân lý sau:

- **@[.claude]** (`.claude/`): Chứa cấu hình Agents, Commands, và Workflows.
- **@[.claude-skills]** (`.claude-skills/`): Chứa các kỹ năng chuyên sâu (Skills).

### 4. 🔮 QUANTUM ACTIVATION PROTOCOL (SESSION START)

> **"Lượng Tử Hóa - Load toàn bộ context trong một lệnh"**

**On EVERY new session or complex task, Agent MUST:**

1.  **Read `@[.claude]/docs/QUANTUM_MANIFEST.md`** - Contains:
    - 24 Agents inventory
    - 44 Skills index
    - 6 Hooks definitions
    - Bridge mappings
    - WIN-WIN-WIN gate status

2.  **Or run `/quantum` command** - Auto-loads all context

3.  **Verify Engine Status:**
    - Model: `gemini-3-flash[1m]` (Speed) or `gemini-3-pro-high[1m]` (Depth)
    - Proxy: `antigravity-claude-proxy` @ 8080

**Benefits:**

- ⚡ Eliminates 10+ file reads at session start
- 🎯 Reduces hallucination about available capabilities
- 🚀 Maximizes Gemini 1M context efficiency

---

## Workflows

- Primary workflow: `./.claude/rules/primary-workflow.md`
- Development rules: `./.claude/rules/development-rules.md`
- Orchestration protocols: `./.claude/rules/orchestration-protocol.md`
- Documentation management: `./.claude/rules/documentation-management.md`
- And other workflows: `./.claude/rules/*`

**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT:** You must follow strictly the development rules in `./.claude/rules/development-rules.md` file.
**IMPORTANT:** Before you plan or proceed any implementation, always read the `./README.md` file first to get context.
**IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
**IMPORTANT:** In reports, list any unresolved questions at the end, if any.

## Configuration Precedence

The project follows a clear configuration hierarchy to resolve conflicts:

1. `.claude/config/` (Project overrides - HIGHEST priority)
2. `.claude/rules/` (Project defaults)
3. `$HOME/.claude/workflows/` (Global defaults)
4. Built-in defaults (LOWEST priority)

See `./.claude/config/precedence.md` for detailed documentation on config resolution.

## Hook Response Protocol

### Privacy Block Hook (`@@PRIVACY_PROMPT@@`)

When a tool call is blocked by the privacy-block hook, the output contains a JSON marker between `@@PRIVACY_PROMPT_START@@` and `@@PRIVACY_PROMPT_END@@`. **You MUST use the `AskUserQuestion` tool** to get proper user approval.

**Required Flow:**

1. Parse the JSON from the hook output
2. Use `AskUserQuestion` with the question data from the JSON
3. Based on user's selection:
    - **"Yes, approve access"** → Use `bash cat "filepath"` to read the file (bash is auto-approved)
    - **"No, skip this file"** → Continue without accessing the file

**Example AskUserQuestion call:**

```json
{
    "questions": [
        {
            "question": "I need to read \".env\" which may contain sensitive data. Do you approve?",
            "header": "File Access",
            "options": [
                {
                    "label": "Yes, approve access",
                    "description": "Allow reading .env this time"
                },
                {
                    "label": "No, skip this file",
                    "description": "Continue without accessing this file"
                }
            ],
            "multiSelect": false
        }
    ]
}
```

**IMPORTANT:** Always ask the user via `AskUserQuestion` first. Never try to work around the privacy block without explicit user approval.

## Python Scripts (Skills)

When running Python scripts from `.claude/skills/`, use the venv Python interpreter:

- **Linux/macOS:** `.claude/skills/.venv/bin/python3 scripts/xxx.py`
- **Windows:** `.claude\skills\.venv\Scripts\python.exe scripts\xxx.py`

This ensures packages installed by `install.sh` (google-genai, pypdf, etc.) are available.

**IMPORTANT:** When scripts of skills failed, don't stop, try to fix them directly.

## [IMPORTANT] Consider Modularization

- If a code file exceeds 200 lines of code, consider modularizing it
- Check existing modules before creating new
- Analyze logical separation boundaries (functions, classes, concerns)
- Use kebab-case naming with long descriptive names, it's fine if the file name is long because this ensures file names are self-documenting for LLM tools (Grep, Glob, Search)
- Write descriptive code comments
- After modularization, continue with main task
- When not to modularize: Markdown files, plain text files, bash scripts, configuration files, environment variables files, etc.

## Documentation Management

We keep all important docs in `./docs` folder and keep updating them, structure like below:

```
./docs
├── project-overview-pdr.md
├── code-standards.md
├── codebase-summary.md
├── design-guidelines.md
├── deployment-guide.md
├── system-architecture.md
└── project-roadmap.md
```

**IMPORTANT:** _MUST READ_ and _MUST COMPLY_ all _INSTRUCTIONS_ in project `./CLAUDE.md`, especially _WORKFLOWS_ section is _CRITICALLY IMPORTANT_, this rule is _MANDATORY. NON-NEGOTIABLE. NO EXCEPTIONS. MUST REMEMBER AT ALL TIMES!!!_
