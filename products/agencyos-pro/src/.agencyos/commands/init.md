---
description: Initialize AgencyOS in any project - Zero effort, one command
---

# /init

## IDENTITY

Bạn là AgencyOS Init Agent. Khi user gọi `/init`, bạn PHẢI TỰ ĐỘNG setup toàn bộ AgencyOS trong project hiện tại mà KHÔNG hỏi gì.

## TRIGGER

```
/init
/init my-project
```

## AUTO-EXECUTE SEQUENCE

### 1. CREATE .agencyos/ structure

```bash
mkdir -p .agencyos/commands
mkdir -p .agencyos/workflows
mkdir -p docs
```

### 2. CREATE AGENCYOS.md

```markdown
# AGENCYOS.md

This file provides guidance to AgencyOS CLI.

## Role & Responsibilities
Your role is to analyze user requirements and deliver features.

## Workflows
- Primary: `./.agencyos/workflows/primary-workflow.md`
- Development rules: `./.agencyos/workflows/development-rules.md`

## Documentation
We keep docs in `./docs` and update them.
```

### 3. CREATE primary-workflow.md

```markdown
# Primary Workflow

1. Understand requirements
2. Plan implementation
3. Write code
4. Test
5. Commit
```

### 4. CREATE development-rules.md

```markdown
# Development Rules

1. Write clean, readable code
2. Add tests for new features
3. Document public APIs
4. Use conventional commits
```

### 5. CREATE mcp.json

```json
{
  "mcpServers": {
    "git-mcp": {"command": "npx", "args": ["-y", "@anthropic/mcp-git"]}
  }
}
```

### 6. UPDATE .gitignore

Thêm vào .gitignore:
```
.env
*.log
node_modules/
```

### 7. COMMIT (if git repo)

```bash
git add .agencyos/ AGENCYOS.md docs/
git commit -m "feat: initialize AgencyOS"
```

### 8. REPORT

```
✅ AgencyOS Initialized!

📁 Created:
├── .agencyos/
│   ├── commands/
│   ├── workflows/
│   │   ├── primary-workflow.md
│   │   └── development-rules.md
│   └── mcp.json
├── AGENCYOS.md
└── docs/

🎯 Next: Just start coding! Use /plan, /code, /ship

No setup needed - ready to go! 🚀
```

## RULES

1. **ZERO QUESTIONS** - Không hỏi user
2. **AUTO-DETECT** - Tự nhận diện project type
3. **AUTO-CREATE** - Tự tạo tất cả files
4. **AUTO-COMMIT** - Tự commit nếu là git repo
5. **ONLY REPORT** - Chỉ thông báo kết quả

## ERROR HANDLING

```
Directory exists? → Merge, don't overwrite
No git? → Skip commit step
Permission error? → Suggest sudo or fix permissions
```
