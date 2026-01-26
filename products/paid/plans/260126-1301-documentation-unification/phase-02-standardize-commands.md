# Phase 2: Command Standardization

**Priority:** HIGH
**Status:** COMPLETE
**Estimated Time:** 2-3 hours
**Completed:** 2026-01-26

## Context

Phase 1 consolidated all commands into CLI_REFERENCE.md. Phase 2 focuses on standardizing the getting-started.md examples to use modern `cc` commands while maintaining backward compatibility documentation.

## Requirements

### Functional Requirements
1. Update getting-started.md examples to use modern `cc` commands
2. Add deprecation warnings for legacy commands
3. Ensure migration guide accuracy
4. Update all code examples throughout documentation

### Non-Functional Requirements
- Maintain Vietnamese cultural context
- Preserve all existing functionality
- Keep examples clear and beginner-friendly
- Ensure consistency across all documentation

## Architecture

### Documentation Update Strategy

```
getting-started.md updates:
├── Section 2: Khởi Tạo "Linh Hồn"
│   ├── Replace: mekong init → cc client init
│   └── Add: Deprecation note with link
├── Section 3: "Nấu" Tính Năng
│   ├── Replace: mekong run-scout → cc workflow scout
│   ├── Replace: /cook → cc agent spawn --type coder
│   └── Add: Deprecation notes
├── Section 4: Kiếm Tiền
│   ├── Replace: /quote → cc sales quote
│   ├── Replace: /win3 → cc strategy validate-win
│   ├── Replace: /proposal → cc sales proposal
│   └── Add: Deprecation notes
├── Section 5: Quản Trị Tổng Thể
│   ├── Replace: /antigravity → cc analytics dashboard
│   └── Add: Deprecation note
└── Section 7: Pro Tips
    ├── Replace: /help → cc --help
    ├── Replace: /jules → cc devops cleanup
    └── Add: Deprecation notes
```

## Related Code Files

**Files to Modify:**
- `docs/getting-started.md` - Update all command examples

**Files to Verify:**
- `docs/CLI_REFERENCE.md` - Ensure migration guide is complete
- `docs/command-index.md` - Verify all modern commands listed

## Implementation Steps

### Step 1: Update Section 2 (Khởi Tạo)
1. Replace `mekong init` example with `cc client init`
2. Add sidebar note showing legacy command with link to docs
3. Preserve Vietnamese cultural naming and philosophy

### Step 2: Update Section 3 (First Cook)
1. Replace `mekong run-scout` with `cc workflow scout`
2. Replace `/cook` with `cc agent spawn --type coder --task`
3. Add deprecation notes with links to CLI_REFERENCE.md sections
4. Keep explanation of 3-step process (Plan, Code, Test)

### Step 3: Update Section 4 (Money Making)
1. Replace `/quote` with `cc sales quote`
2. Replace `/win3` with `cc strategy validate-win`
3. Replace `/proposal` with `cc sales proposal`
4. Add deprecation notes for each command
5. Preserve WIN-WIN-WIN philosophy explanation

### Step 4: Update Section 5 (Dashboard)
1. Replace `/antigravity` with `cc analytics dashboard`
2. Add note about additional monitoring commands:
   - `cc monitor status`
   - `cc analytics kpi`
   - `cc revenue dashboard`

### Step 5: Update Section 7 (Pro Tips)
1. Replace `/help` with `cc --help`
2. Replace `/jules` with `cc devops cleanup`
3. Add reference to `cc` module system exploration

### Step 6: Add Deprecation Warning Box
1. Create prominent callout at top of getting-started.md
2. Explain legacy vs modern commands
3. Link to migration guide in CLI_REFERENCE.md

### Step 7: Verify All Links
1. Check all internal documentation links
2. Verify anchor links to CLI_REFERENCE.md sections
3. Test navigation flow

## Todo List

- [x] Step 1: Update Section 2 (Khởi Tạo)
- [x] Step 2: Update Section 3 (First Cook)
- [x] Step 3: Update Section 4 (Money Making)
- [x] Step 4: Update Section 5 (Dashboard)
- [x] Step 5: Update Section 7 (Pro Tips)
- [x] Step 6: Add Deprecation Warning Box
- [x] Step 7: Verify All Links

## Success Criteria

- [x] All command examples use modern `cc` syntax
- [x] Legacy commands shown in "Alternative" or "Legacy" notes
- [x] All deprecation warnings link to CLI_REFERENCE.md
- [x] Vietnamese cultural context preserved
- [x] No broken links
- [x] Beginner-friendly explanations maintained

## Risk Assessment

**Low Risk:**
- Documentation-only changes
- Backward compatibility fully preserved
- No code modifications

**Mitigation:**
- Keep legacy command documentation visible
- Test all navigation links
- Preserve all cultural context and philosophy

## Security Considerations

- None (documentation only)
- Ensure no API keys or secrets in examples

## Next Steps

After completion → Phase 3: Binh Pháp Namespace
