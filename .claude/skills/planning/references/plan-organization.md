# Plan Creation & Organization

## Directory Structure

### Plan Location
Save plans in `./plans` directory with timestamp and descriptive name.

**Format:** `plans/{date}-your-plan-name/` (date format from `$CK_PLAN_DATE_FORMAT`)

**Example:** `plans/20251101-1505-authentication-and-profile-implementation/`

### File Organization

```
plans/
├── 20251101-1505-authentication-and-profile-implementation/
    ├── research/
    │   ├── researcher-XX-report.md
    │   └── ...
│   ├── reports/
│   │   ├── scout-report.md
│   │   ├── researcher-report.md
│   │   └── ...
│   ├── plan.md                                # Overview access point
│   ├── phase-01-setup-environment.md          # Setup environment
│   ├── phase-02-implement-database.md         # Database models
│   ├── phase-03-implement-api-endpoints.md    # API endpoints
│   ├── phase-04-implement-ui-components.md    # UI components
│   ├── phase-05-implement-authentication.md   # Auth & authorization
│   ├── phase-06-implement-profile.md          # Profile page
│   └── phase-07-write-tests.md                # Tests
└── ...
```

### Active Plan State Tracking

Plan context is managed via env vars and session state:
- **`$CK_ACTIVE_PLAN`**: Env var set at session start, provides initial plan context
- **Session temp file**: Updated when creating new plans, subagents read latest context

**Pre-Creation Check:**
1. Check `$CK_ACTIVE_PLAN` env var (or Plan Context injected by SubagentStart hook)
2. If set and valid directory → ask user "Continue with existing plan? [Y/n]"
   - Y → reuse existing
   - n → create new
3. If empty → create new plan

**After Creating Plan:**
```bash
# Update session state so subagents get the new plan context:
node .claude/scripts/set-active-plan.cjs plans/{date}-plan-name
```

**Report Output Rules:**
1. Use `$CK_ACTIVE_PLAN` (or Plan Context from hook) to get plan path
2. Write reports to `{plan-path}/reports/`
3. Use naming: `{agent}-{date}-{slug}.md`
4. Fallback: `plans/reports/` if no active plan

## File Structure

### Overview Plan (plan.md)
- Keep generic and under 80 lines
- List each phase with status/progress
- Link to detailed phase files
- Key dependencies

### Phase Files (phase-XX-name.md)
Fully respect the `./docs/development-rules.md` file.
Each phase file should contain:

**Context Links**
- Links to related reports, files, documentation

**Overview**
- Priority
- Current status
- Brief description

**Key Insights**
- Important findings from research
- Critical considerations

**Requirements**
- Functional requirements
- Non-functional requirements

**Architecture**
- System design
- Component interactions
- Data flow

**Related Code Files**
- List of files to modify
- List of files to create
- List of files to delete

**Implementation Steps**
- Detailed, numbered steps
- Specific instructions

**Todo List**
- Checkbox list for tracking

**Success Criteria**
- Definition of done
- Validation methods

**Risk Assessment**
- Potential issues
- Mitigation strategies

**Security Considerations**
- Auth/authorization
- Data protection

**Next Steps**
- Dependencies
- Follow-up tasks
