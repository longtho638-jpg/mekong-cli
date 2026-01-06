---
description: How to develop new features using AgencyOS agentic workflow
---

# Feature Development Workflow

Develop features with agentic assistance in 6 phases.

## Overview
| Phase | Command | Time |
|-------|---------|------|
| Planning | `/plan` | 5 min |
| Implementation | `/code` | 15-30 min |
| Testing | `/fix:test` | 5 min |
| Code Review | `/code-review` | 3 min |
| CI/CD Prep | `/fix:ci` | 2 min |
| Deploy | `/git:cm /git:pr` | 2 min |

## Step-by-Step Guide

### 1. Planning Phase
// turbo
```bash
/plan "add user authentication with OAuth providers"
```

What happens:
- Planner Agent creates detailed implementation plan
- Researcher Agent analyzes best practices
- Code Reviewer Agent reviews plan
- Generates plan file with phases and tasks

Output: `plans/YYYYMMDD-HHMM-feature-description/`

### 2. Implementation Phase
// turbo
```bash
/code
```

What happens:
- Reads the latest plan
- Fullstack Developer Agent implements backend/frontend
- UI/UX Designer Agent creates interfaces
- Database Admin Agent handles schema changes

Output:
- Code following best practices
- Database migrations
- API endpoints
- Frontend components

### 3. Testing Phase
// turbo
```bash
/fix:test
```

What happens:
- Tester Agent writes comprehensive tests
- Runs unit, integration, E2E tests
- Debugger Agent investigates failures

Output: Complete test suite with 90%+ coverage

### 4. Code Review Phase
// turbo
```bash
/code-review "review authentication implementation"
```

What happens:
- Security and performance analysis
- Architectural validation
- Generates review report with recommendations

### 5. Deployment Preparation
// turbo
```bash
/fix:ci "prepare for production deployment"
```

What happens:
- Debugger Agent fixes CI/CD issues
- DevOps Agent prepares deployment configs
- Updates deployment documentation

### 6. Commit & Deploy
// turbo
```bash
/git:cm /git:pr "feature/user-authentication"
```

What happens:
- Stages and commits with conventional format
- Creates professional commit message
- Opens pull request with detailed description

## Real Example

### Adding OAuth Authentication
```bash
# Step 1: Plan
/plan "add user authentication with Better Auth including OAuth providers"

# Step 2: Implement
/code

# Step 3: Test
/fix:test

# Step 4: Review & Deploy
/code-review "authentication implementation" /fix:ci /git:cm /git:pr "feature/user-authentication"
```

## Best Practices

### Before Starting
- Clear requirements documented
- Design decisions approved
- Dependencies identified

### During Implementation
- Commit frequently
- Test as you go
- Update documentation

### Before Deployment
- All tests passing
- CI/CD pipeline green
- Staging environment validated

## Troubleshooting

### Common Issues
| Issue | Solution |
|-------|----------|
| Build fails | Run `/fix:ci` |
| Tests fail | Run `/fix:test` |
| Merge conflicts | Run `/git:resolve` |

## 🏯 Binh Pháp Alignment
"謀攻篇" (Attack by Stratagem) - Plan before you build.
