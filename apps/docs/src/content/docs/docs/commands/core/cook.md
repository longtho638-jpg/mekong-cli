---
title: /cook
description: "Documentation"
section: docs
category: commands/core
order: 2
published: true
ai_executable: true
---

# /cook

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/commands/core/cook
```



:::tip[Token-Saving Tip: /cook = /plan + /code]
**If you already have a plan**, skip `/cook` and use `/code` directly:

```bash
# ✅ Efficient: Use existing plan (saves tokens!)
/code @plans/your-feature-plan.md

# ❌ Wasteful: /cook will create a new plan, consuming extra tokens
/cook [same feature you already planned]
```

**The relationship:**
- `/cook` = `/plan` + `/code` (full cycle: planning → implementation)
- `/code` = Implementation only (uses existing plan)

**When to use each:**
| Command | When to Use |
|---------|-------------|
| `/cook` | New feature, no plan exists |
| `/code @plan.md` | Plan already exists in `plans/` directory |
:::

Main command for feature development. Orchestrates planning, implementation, testing, code review, and documentation updates automatically.

## Syntax

```bash
/cook [feature description]
```

## How It Works

The `/cook` command follows a complete development workflow:

### 1. Planning (if needed)

If no plan exists:
- Invokes **planner** agent to create implementation plan
- Saves plan to `plans/` directory
- Asks for your approval before proceeding

If plan exists:
- Uses existing plan from `plans/` directory
- Proceeds directly to implementation

### 2. Scout (for complex features)

For features requiring multiple file changes:
- Invokes **scout** agents to locate relevant files
- Identifies integration points
- Maps dependencies

### 3. Implementation

Main implementation phase:
- Writes code following plan
- Adheres to project code standards
- Follows established patterns
- Implements error handling
- Adds input validation

### 4. Testing

Automatically generates and runs tests:
- Unit tests for new functions
- Integration tests for APIs
- E2E tests for user flows
- Validates test coverage >80%

### 5. Code Review

Invokes **code-reviewer** agent to:
- Check code quality
- Verify security practices
- Validate performance
- Ensure best practices followed

### 6. Documentation

Updates documentation:
- API documentation
- Code comments
- Architecture docs
- Usage examples

### 7. Summary Report

Provides completion report:
- Files created/modified
- Tests generated
- Coverage metrics
- Next steps

## Agents Orchestrated

The `/cook` command intelligently orchestrates **multiple agents** from AgencyOS's 18-agent system:

| Phase | Agent | Purpose |
|-------|-------|---------|
| **Planning** | [planner](/docs/agents/planner) | Create implementation plan, research best practices |
| **Discovery** | [scout](/docs/agents/scout) | Locate relevant files across codebase |
| **Research** | [researcher](/docs/agents/researcher) | Find libraries, security patterns, best practices |
| **Implementation** | [fullstack-developer](/docs/agents/fullstack-developer) | Execute code changes with file ownership |
| **Testing** | [tester](/docs/agents/tester) | Generate and run comprehensive test suites |
| **Quality** | [code-reviewer](/docs/agents/code-reviewer) | Security audits, performance analysis |
| **Database** | [database-admin](/docs/agents/database-admin) | Schema design, query optimization (when needed) |
| **Documentation** | [docs-manager](/docs/agents/docs-manager) | Update technical documentation |
| **Commit** | [git-manager](/docs/agents/git-manager) | Conventional commits (when using /git:cm) |

**Additional agents invoked as needed:**
- [debugger](/docs/agents/debugger) - If errors occur during implementation
- [ui-ux-designer](/docs/agents/ui-ux-designer) - For frontend features
- [brainstormer](/docs/agents/brainstormer) - For complex architectural decisions

## Examples

### Basic Feature

```bash
/cook [add user registration endpoint]
```

**What happens:**
```
1. planner: Creates implementation plan
   - POST /auth/register endpoint
   - Email/password validation
   - Password hashing
   - JWT token generation

2. Implementation
   - src/routes/auth.js created
   - src/middleware/validate.js created
   - src/utils/hash.js created

3. Testing
   - tests/auth/register.test.js created
   - 12 tests generated
   - Coverage: 92%

4. Documentation
   - docs/api/authentication.md updated

✓ Feature complete
```

### Complex Feature

```bash
/cook [implement real-time chat with WebSocket support]
```

**What happens:**
```
1. Scout Phase
   - Locates WebSocket configuration
   - Finds existing event handlers
   - Identifies authentication middleware

2. Planning
   - WebSocket server setup
   - Room management
   - Message persistence
   - Authentication integration

3. Implementation
   - src/websocket/server.js
   - src/websocket/rooms.js
   - src/models/message.js
   - Database migrations

4. Testing
   - WebSocket connection tests
   - Message delivery tests
   - Room management tests
   - Integration tests with auth

5. Documentation
   - WebSocket API documented
   - Usage examples added
```

### Integration Feature

```bash
/cook [add Stripe payment processing]
```

**What happens:**
```
1. Research (via planner)
   - Stripe API best practices
   - Security considerations
   - Webhook handling

2. Implementation
   - Stripe SDK integration
   - Payment intent creation
   - Webhook endpoint
   - Error handling

3. Testing
   - Mock Stripe responses
   - Test payment flows
   - Webhook validation

4. Security Review
   - API key management
   - Webhook signature verification
   - Error message sanitization
```

## When to Use /cook

### ✅ Use /cook for:

- **New Features**: Adding functionality that doesn't exist
- **API Endpoints**: Creating new routes/controllers
- **Database Models**: Adding new entities
- **Integrations**: Connecting external services
- **Refactoring**: Restructuring existing code
- **Enhancements**: Improving existing features

### ❌ Don't use /cook for:

- **Bug Fixes**: Use `/fix:fast` or `/fix:hard` instead
- **Type Errors**: Use `/fix:types` instead
- **UI Issues**: Use `/fix:ui` instead
- **CI Failures**: Use `/fix:ci` instead
- **Just Planning**: Use `/plan` instead

## With Existing Plan

If you've already created a plan with `/plan`:

```bash
# 1. Create plan first
/plan [add two-factor authentication]

# 2. Review the plan
cat plans/two-factor-auth.md

# 3. Implement using plan
/cook [implement two-factor authentication]

# System uses existing plan automatically
```

## Without Plan (Ad-hoc)

For simple features, skip planning:

```bash
/cook [add email validation to user registration]

# System determines no plan needed
# Implements directly
# Still generates tests and docs
```

## Best Practices

### Provide Clear Descriptions

✅ **Good:**
```bash
/cook [implement password reset flow with email verification]
/cook [add file upload endpoint with S3 integration]
/cook [create admin dashboard with user management]
```

❌ **Vague:**
```bash
/cook [add stuff]
/cook [make it better]
/cook [fix things]
```

### Let It Run

Don't interrupt the process:
- ✅ Let all agents complete
- ✅ Review results at the end
- ✅ Provide feedback after completion

Interrupting can cause:
- Incomplete implementation
- Missing tests
- Outdated documentation

### Review Before Committing

```bash
# 1. Cook the feature
/cook [add rate limiting middleware]

# 2. Review changes
git diff

# 3. Run tests manually if desired
npm test

# 4. Check documentation
cat docs/api/rate-limiting.md

# 5. Only then commit
/git:cm
```

### Iterate on Feedback

If result isn't perfect:
```bash
# First attempt
/cook [add caching layer]

# Review result
# Not satisfied with Redis configuration

# Provide feedback
"The Redis connection should use connection pooling and handle reconnection gracefully"

# System adjusts implementation
```

## Generated Artifacts

After `/cook` completes, you'll have:

### Code Files

```
src/
├── routes/              # New routes
├── controllers/         # New controllers
├── models/             # New models
├── middleware/         # New middleware
├── utils/              # Helper functions
└── services/           # Business logic
```

### Test Files

```
tests/
├── unit/               # Unit tests
│   └── feature.test.js
├── integration/        # Integration tests
│   └── feature-api.test.js
└── e2e/               # End-to-end tests
    └── feature-flow.test.js
```

### Documentation

```
docs/
├── api/               # API documentation
│   └── new-endpoint.md
└── guides/           # Usage guides
    └── new-feature.md
```

### Plan (if created)

```
plans/
└── feature-name-YYYYMMDD.md
```

## Progress Tracking

During execution, you'll see real-time updates:

```
✓ planner Agent: Implementation plan created
⟳ Code Agent: Implementing authentication module...
⧗ tester Agent: Pending
⧗ code-reviewer Agent: Pending

Files Created:
✓ src/auth/login.js
⟳ src/auth/register.js
⧗ src/middleware/auth.js

Tests Generated:
✓ tests/auth/login.test.js (8 tests)
⟳ tests/auth/register.test.js (12 tests)
```

## Error Handling

If something goes wrong:

### Implementation Errors

```
❌ Error during implementation:
   TypeError: Cannot read property 'user' of undefined
   at src/auth/login.js:23

Invoking debugger agent...
```

System automatically:
1. Invokes **debugger** agent
2. Analyzes error
3. Attempts fix
4. Re-runs tests

### Test Failures

```
❌ Tests failed:
   12 passed, 3 failed

Invoking tester agent for analysis...
```

System:
1. Analyzes test failures
2. Identifies root cause
3. Fixes implementation
4. Re-runs tests

## Advanced Usage

### Specify Implementation Approach

```bash
/cook [add search functionality using Elasticsearch instead of database queries]
```

### Include Specific Requirements

```bash
/cook [implement file uploads with:
- Maximum 10MB file size
- Support for images and PDFs
- Virus scanning with ClamAV
- S3 storage
- Thumbnail generation for images
]
```

### Request Specific Testing

```bash
/cook [add payment processing with comprehensive test coverage including edge cases and error scenarios]
```

## Common Patterns

### API Endpoint

```bash
/cook [create GET /api/users endpoint with pagination and filtering]
```

### Database Model

```bash
/cook [add Product model with inventory tracking and low stock alerts]
```

### Background Job

```bash
/cook [implement email queue processor using Bull and Redis]
```

### Middleware

```bash
/cook [create API key authentication middleware with rate limiting]
```

## After Cooking

Standard workflow after `/cook`:

```bash
# 1. Feature implemented
/cook [add notifications system]

# 2. Review changes
git status
git diff

# 3. Run tests
/test

# 4. Fix any issues
/fix:test  # if tests fail

# 5. Update docs if needed
/docs:update

# 6. Commit
/git:cm

# 7. Push
git push

# 8. Create PR
/git:pr
```

## Troubleshooting

### Too Many Files Changed

**Problem:** Feature modified too many files unexpectedly

**Solution:**
- Review plan before implementing
- Provide more specific feature description
- Use `/scout` first to see what exists

### Tests Not Passing

**Problem:** Generated tests failing

**Solution:**
```bash
/fix:test
# Debugger agent analyzes and fixes
```

### Missing Features

**Problem:** Some requirements not implemented

**Solution:**
```bash
# Add missing features
/cook [add the missing password strength validation]
```

### Code Quality Issues

**Problem:** Generated code doesn't meet standards

**Solution:**
- Review `.agencyos/workflows/development-rules.md`
- Update code standards in `docs/code-standards.md`
- Re-run `/cook` with updated context

## Next Steps

- [/test](/docs/commands/core/test) - Run test suite
- [/fix:test](/docs/commands/fix/test) - Fix test failures
- [/git:cm](/docs/commands/git/commit) - Commit changes
- [/docs:update](/docs/commands/docs/update) - Update documentation

---

**Key Takeaway**: `/cook` is your primary feature development command, handling everything from planning to tested, documented code automatically.
