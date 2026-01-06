---
description: How to add new features to an AgencyOS project
---

# Adding a New Feature

Complete 11-step workflow for adding features professionally.

## 🚀 Quick Start
```bash
# Simple feature
/cook "add GET /api/users/:id/profile endpoint"

# Complex feature
/plan "add password reset flow with email verification"
/code
```

## Step-by-Step Workflow

### Step 1: Define Feature Requirements
Good descriptions:
- ✅ "Add password reset flow with email verification"
- ✅ "Implement product search with filters and pagination"  
- ❌ "Add password stuff" (too vague)

### Step 2: Research and Plan
// turbo
```bash
/plan "add password reset flow with email verification"
```

What happens:
- Researcher agents analyze best practices
- Project structure analyzed
- Implementation plan created
- Plan saved to `plans/feature-name.md`

### Step 3: Review the Plan
// turbo
```bash
cat plans/password-reset-*.md
```

Review checklist:
- [ ] All requirements covered
- [ ] Security considerations included
- [ ] Database changes documented
- [ ] Testing strategy defined

Provide feedback if needed:
```bash
"Please add SMS verification as an alternative to email"
```

### Step 4: Scout Existing Code (Optional)
// turbo
```bash
/scout "authentication patterns in this codebase"
```

### Step 5: Implement the Feature
// turbo
```bash
/code
```

### Step 6: Run Tests
// turbo
```bash
/fix:test
npm test
```

### Step 7: Code Review
// turbo
```bash
/code-review "password reset implementation"
```

### Step 8: Update Documentation
// turbo
```bash
/docs:update
```

### Step 9: Manual Testing (Optional)
// turbo
```bash
npm run dev
# Test in browser/Postman
```

### Step 10: Commit Changes
// turbo
```bash
/git:cm
```

### Step 11: Create Pull Request (Optional)
// turbo
```bash
/git:pr "feature/password-reset"
```

## Common Variations

### API Endpoint Only
// turbo
```bash
/cook "add GET /api/users/:id/profile endpoint"
```

### Database-Heavy Feature
// turbo
```bash
/plan "implement multi-tenant architecture"
/code @plans/multi-tenant.md
```

### UI + Backend Feature
// turbo
```bash
/cook "implement backend API for notifications"
/cook "implement frontend notification panel"
```

### Third-Party Integration
// turbo
```bash
/plan "integrate Twilio SMS notifications"
/code @plans/twilio-sms.md
```

## Best Practices

1. **Plan Complex Features** - Always use `/plan` for multi-file changes
2. **Small, Focused Features** - Break large features into smaller units
3. **Test Immediately** - Run tests after each implementation step
4. **Document as You Go** - Use `/docs:update` regularly
5. **Review Before Committing** - Always run `/code-review`
6. **Use Feature Branches** - Git workflow for safety

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Feature too large | Break into smaller parts with `/plan` |
| Tests failing | Fix with `/fix:test` |
| Missing edge cases | Ask for comprehensive testing |
| Performance concerns | Request optimization analysis |
| Documentation unclear | Use `/docs:update` |

## Time Comparison
| Approach | Time |
|----------|------|
| Traditional | 4+ hours |
| With AgencyOS | 45 min |

## 🏯 Binh Pháp Alignment
"形勢篇" (Terrain) - Understand the landscape before building.
