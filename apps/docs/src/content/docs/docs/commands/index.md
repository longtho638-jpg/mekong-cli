---
title: Commands Overview
description: "135+ ZERO-EFFORT Commands with Binh Pháp alignment"
section: docs
category: commands
order: 0
published: true
ai_executable: true
---

# Commands Overview

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/commands
```



> 🏯 **135+ Commands** × **13 Binh Pháp Clusters** × **ZERO-EFFORT Automation**

AgencyOS provides **135 ZERO-EFFORT slash commands** across 11 business suites. Each command is Binh Pháp aligned and automatically orchestrates the appropriate agents - **NO USER INPUT REQUIRED**.

## 🏯 Business Suites (135 Commands)

| Suite | Commands | Binh Pháp |
|-------|----------|-----------|
| 🔥 [Marketing](/docs/commands/marketing/) | 8 | 謀攻篇 Mưu Công |
| 🛒 [Sales](/docs/commands/sales/) | 8 | 作戰篇 Tác Chiến |
| 💰 [Finance](/docs/commands/finance/) | 8 | 計篇 Kế |
| 📚 [Docs](/docs/commands/docs-suite/) | 6 | 法篇 Pháp |
| ⚡ [Development](/docs/commands/utility/) | 18 | 九變篇 Cửu Biến |
| 🧪 [Testing](/docs/commands/testing/) | 10 | 虛實篇 Hư Thực |
| 📦 [Git](/docs/commands/git/) | 8 | 行軍篇 Hành Quân |
| 🎯 [Strategy](/docs/commands/strategy/) | 10 | 計篇 Kế |
| 🏢 [Agency](/docs/commands/agency/) | 10 | 始計篇 Thủy Kế |
| 🇻🇳 [Vietnamese](/docs/commands/vietnamese/) | 10 | 地形篇 Địa Hình |
| 🔄 [Sync](/docs/commands/sync-commands) | 8 | 用間篇 Dụng Gián |
| [Core](/docs/commands/core/) | 31 | Mixed |

---

## Command Categories

### Core Development

- **[/bootstrap](/docs/commands/core/bootstrap)** - Initialize new projects with spec-driven development
- **[/cook](/docs/commands/core/cook)** - Develop new features
- **[/plan](/docs/commands/core/plan)** - Create implementation plans
- **[/brainstorm](/docs/commands/core/brainstorm)** - Explore feature feasibility
- **[/ask](/docs/commands/core/ask)** - Ask questions about the codebase
- **[/watzup](/docs/commands/core/watzup)** - Get project status and recent changes
- **[/scout](/docs/commands/core/scout)** - Find files across large codebases
- **[/test](/docs/commands/core/test)** - Run test suite and get results
- **[/debug](/docs/commands/core/debug)** - Investigate and diagnose issues

### Bug Fixing

- **[/fix](/docs/commands/fix/)** - Intelligently fix any issue (auto-selects fast/hard approach)
- **[/fix:fast](/docs/commands/fix/fast)** - Fix minor bugs quickly
- **[/fix:hard](/docs/commands/fix/hard)** - Fix complex bugs with thorough analysis
- **[/fix:ci](/docs/commands/fix/ci)** - Fix GitHub Actions CI failures
- **[/fix:logs](/docs/commands/fix/logs)** - Analyze and fix issues from logs
- **[/fix:test](/docs/commands/fix/test)** - Fix failing tests
- **[/fix:ui](/docs/commands/fix/ui)** - Fix UI/UX issues
- **[/fix:types](/docs/commands/fix/types)** - Fix TypeScript type errors

### Documentation

- **[/docs:init](/docs/commands/docs/init)** - Initialize project documentation
- **[/docs:update](/docs/commands/docs/update)** - Update project documentation
- **[/docs:summarize](/docs/commands/docs/summarize)** - Summarize project documentation

### Git Operations

- **[/git:cm](/docs/commands/git/commit)** - Stage and commit changes
- **[/git:cp](/docs/commands/git/commit-push)** - Stage, commit, and push
- **[/git:pr](/docs/commands/git/pull-request)** - Create pull request

### Planning

- **[/plan:ci](/docs/commands/plan/ci)** - Analyze CI failures and create fix plan
- **[/plan:two](/docs/commands/plan/two)** - Create plan with 2 approaches
- **[/plan:cro](/docs/commands/plan/cro)** - Create conversion optimization plan

### Design & UI

- **[/design:3d](/docs/commands/design/3d)** - Create 3D designs with Three.js
- **[/design:describe](/docs/commands/design/describe)** - Extract design from screenshots
- **[/design:fast](/docs/commands/design/fast)** - Quick design creation
- **[/design:good](/docs/commands/design/good)** - Complete, refined design
- **[/design:screenshot](/docs/commands/design/screenshot)** - Screenshot to code
- **[/design:video](/docs/commands/design/video)** - Video to code

### Content & Marketing

- **[/content:cro](/docs/commands/content/cro)** - Conversion-optimized content
- **[/content:enhance](/docs/commands/content/enhance)** - Enhance existing content
- **[/content:fast](/docs/commands/content/fast)** - Quick content creation
- **[/content:good](/docs/commands/content/good)** - High-quality content with research

### Integrations

- **[/integrate:polar](/docs/commands/integrate/polar)** - Integrate Polar.sh payments
- **[/integrate:sepay](/docs/commands/integrate/sepay)** - Integrate SePay.vn payments (Vietnam)

### Journaling

- **[/journal](/docs/commands/core/journal)** - Write development journal entries

## Quick Command Reference

### Most Used Commands

```bash
# Feature Development
/plan [feature description]      # Plan the feature
/code @plans/feature.md          # Implement the plan

# Bug Fixing
/fix [any issue]                 # Smart fix (auto-selects approach)
/fix:fast [simple bug]           # Quick fix
/fix:hard [complex issue]        # Thorough investigation + fix
/fix:ci [github-ci-url]          # Fix CI failures

# Documentation
/docs:init                       # First-time setup
/docs:update                     # After making changes

# Git Workflow
/git:cm                          # Commit changes
/git:cp                          # Commit and push
/git:pr [to-branch]              # Create pull request

# Project Status
/watzup                          # What's the current state?
/ask [question]                  # Ask about codebase
```

## Command Syntax

### Basic Syntax

```bash
/command [required-argument] [optional-argument]
```

### Examples

```bash
# No arguments
/test
/watzup
/docs:init

# Required argument
/cook [add user authentication]
/debug [login button not working]
/ask [how does routing work?]

# Optional arguments
/git:pr                          # PR to default branch
/git:pr [develop]                # PR to develop
/git:pr [main] [feature-branch]  # PR from feature to main

# Multiple arguments
/scout [authentication files] [3]  # Find auth files, use 3 agents
```

## Command Workflows

### Starting a New Project

```bash
1. /bootstrap [project description]
   # OR
   python main.py init --kit engineer

2. # Customize requirements through Q&A

3. # System automatically:
   - Researches best practices
   - Creates implementation plan
   - Implements features
   - Generates tests
   - Sets up documentation
```

### Developing a Feature

```bash
1. /plan [feature description]
   # Creates detailed implementation plan

2. # Review plan in plans/ directory

3. /cook [implement the feature]
   # Implements based on plan
   # Generates tests
   # Updates docs

4. /test
   # Validates implementation

5. /git:cm
   # Commits with conventional message
```

### Fixing a Bug

```bash
# Smart fix (recommended - auto-selects approach)
/fix [describe any issue]
# - Analyzes complexity
# - Chooses optimal strategy
# - Implements fix

# OR manually choose approach:

# Simple bug (you know the fix)
/fix:fast [typo in validation message]

# Complex bug (needs investigation)
/fix:hard [users can't login after password reset]
# - Uses scout to find related files
# - Analyzes code and logs
# - Researches solutions
# - Creates fix plan
# - Implements fix
# - Tests thoroughly

# CI failure
/fix:ci [https://github.com/user/repo/actions/runs/123]
# - Reads CI logs
# - Identifies failure cause
# - Implements fix
# - Verifies CI passes
```

### Updating Documentation

```bash
# After implementing features
/docs:update

# When onboarding new team members
/docs:summarize

# When starting with existing codebase
/docs:init
```

## Command Best Practices

### Use the Right Command for the Task

✅ **Correct Usage**
```bash
# Small fixes
/fix:fast [typo in button text]

# Complex issues
/fix:hard [memory leak in websocket connection]

# UI issues with screenshot
/fix:ui [screenshot.png] - button misaligned on mobile
```

❌ **Incorrect Usage**
```bash
# Don't use fast for complex issues
/fix:fast [entire authentication system broken]

# Don't use hard for simple fixes
/fix:hard [typo in comment]
```

### Provide Clear Descriptions

✅ **Clear**
```bash
/plan [add OAuth2 authentication with Google and GitHub providers]
/code @plans/oauth.md  # Implement the plan
/debug [API returns 500 error when creating user with empty email]
```

❌ **Vague**
```bash
/plan [add auth]
/code [make it work]
/debug [something's broken]
```

### Review Before Committing

```bash
# 1. Implement
/cook [add rate limiting]

# 2. Test
/test

# 3. Review changes
git diff

# 4. Commit only if satisfied
/git:cm
```

### Use Sequential Commands for Complex Tasks

```bash
# 1. Understand codebase
/ask [how is authentication currently implemented?]

# 2. Plan changes
/plan [migrate from session-based to JWT authentication]

# 3. Review plan
cat plans/latest-plan.md

# 4. Implement
/cook [migrate to JWT authentication]

# 5. Test
/test

# 6. Fix if needed
/fix:test

# 7. Commit
/git:cm
```

## Command Flags and Options

Some commands support flags:

### /bootstrap

```bash
/bootstrap [project description]              # Interactive Q&A
/bootstrap:auto [detailed description]        # Fully automatic
```

### /git:pr

```bash
/git:pr                      # PR to default branch (main)
/git:pr [develop]            # PR to develop branch
/git:pr [main] [feature]     # PR from feature to main
```

### /plan

```bash
/plan [feature]              # Single approach
/plan:two [feature]          # Two different approaches
```

## Understanding Command Output

Commands provide structured output:

### Planning Commands

```
planner Agent: Analyzing codebase...

Research Results:
- OAuth2 best practices reviewed
- Existing auth patterns identified
- Security considerations documented

Implementation Plan Created:
📄 plans/oauth-implementation.md

Plan Summary:
1. Install dependencies (passport, passport-google-oauth20)
2. Configure OAuth2 providers
3. Implement callback routes
4. Add session management
5. Generate tests
6. Update documentation

Estimated time: 2-3 hours
Files to create: 5
Files to modify: 3

Next: Review plan, then run /code
```

### Implementation Commands

```
Code Agent: Implementing from plan...

Dependencies Installed:
✓ passport (0.6.0)
✓ passport-google-oauth20 (2.0.0)

Files Created:
✓ src/auth/oauth-config.js
✓ src/auth/google-strategy.js
✓ src/routes/auth-callback.js

Tests Generated:
✓ tests/auth/oauth.test.js (15 tests)

Documentation Updated:
✓ docs/api/authentication.md

Implementation complete!

Next: Run /test to validate
```

### Test Commands

```
tester Agent: Running test suite...

Test Results:
✓ Unit tests: 45 passed
✓ Integration tests: 12 passed
✓ E2E tests: 8 passed

Coverage: 87.3%

All tests passed!

Next: Review changes, then /git:cm
```

## Troubleshooting Commands

### Command Not Found

**Problem**: `/command` not recognized

**Solutions:**
1. Verify you're in a AgencyOS project (`ls .agencyos/`)
2. Check command exists (`ls .agencyos/commands/`)
3. Run `python main.py init` to get latest commands
4. Restart AgencyOS CLI

### Command Fails

**Problem**: Command errors during execution

**Solutions:**
1. Check error message for specific issue
2. Verify prerequisites (API keys, dependencies)
3. Review agent logs
4. Try command with simpler input
5. Use `/debug` to investigate

### Unexpected Results

**Problem**: Command doesn't do what expected

**Solutions:**
1. Review command documentation
2. Check if using correct command for task
3. Provide more specific description
4. Review generated plans before implementing
5. Use feedback to refine

## Next Steps

Explore specific command categories:

- [Core Commands](/docs/commands/core/) - Development essentials
- [Fix Commands](/docs/commands/fix/) - Debugging and fixing
- [Design Commands](/docs/commands/design/) - UI/UX creation
- [Git Commands](/docs/commands/git/) - Version control

Or learn about:

- [Agents](/docs/agents/) - How commands invoke agents
- [Workflows](/docs/docs/configuration/workflows) - Command execution flows
- [Quick Start](/docs/getting-started/quick-start) - Hands-on tutorial

---

**Key Takeaway**: AgencyOS commands provide a natural, intuitive interface to powerful agent orchestration, making complex development tasks simple and repeatable.
