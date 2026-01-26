# Phase 3: Binh Pháp Namespace

**Priority:** MEDIUM
**Status:** COMPLETE
**Estimated Time:** 3-4 hours
**Completed:** 2026-01-26

## Context

Phase 3 creates dedicated documentation for the Binh Pháp (兵法 - Art of War) philosophy that underpins Agency OS. This preserves Vietnamese cultural heritage while providing strategic guidance for users.

## Requirements

### Functional Requirements
1. Create `docs/binh-phap-philosophy.md` documenting the 13 Chapters
2. Map each chapter to specific CLI modules and workflows
3. Preserve Vietnamese terminology with English translations
4. Provide strategic guidance for agency operations

### Non-Functional Requirements
- Maintain cultural authenticity
- Make philosophy actionable (not just theoretical)
- Link to practical CLI commands
- Ensure accessibility for non-Vietnamese speakers

## Architecture

### Documentation Structure

```
docs/binh-phap-philosophy.md:
├── Introduction
│   ├── History of Binh Pháp in Agency OS
│   ├── Why Art of War for Agencies?
│   └── How to Use This Guide
├── The 13 Chapters
│   ├── Chapter 1: Kế Hoạch (策劃) - Strategic Assessment
│   │   ├── Philosophy
│   │   ├── Mapped Modules: cc strategy, cc analytics
│   │   ├── Practical Example
│   │   └── Commands
│   ├── Chapter 2: Tác Chiến (作戰) - Waging War
│   │   ├── Philosophy
│   │   ├── Mapped Modules: cc revenue, cc sales
│   │   ├── Practical Example
│   │   └── Commands
│   ├── ... (Chapters 3-13)
│   └── Chapter 13: Dụng Gián (用間) - Intelligence
│       ├── Philosophy
│       ├── Mapped Modules: cc analytics, cc monitor
│       ├── Practical Example
│       └── Commands
├── WIN-WIN-WIN Framework
│   ├── Principle Explanation
│   ├── Validation Workflow
│   └── Command: cc strategy validate-win
├── Practical Workflows
│   ├── Client Acquisition (Chapters 1, 3, 13)
│   ├── Revenue Growth (Chapters 2, 5)
│   ├── Crisis Management (Chapter 11)
│   └── Market Expansion (Chapter 10)
└── References
    ├── Original Sun Tzu Text
    ├── Vietnamese Translation Sources
    └── Further Reading
```

### Module to Chapter Mapping

| CLI Module | Primary Chapter | Secondary Chapters |
|------------|-----------------|-------------------|
| `cc strategy` | Ch 1: Kế Hoạch | Ch 3: Mưu Công |
| `cc revenue` | Ch 2: Tác Chiến | Ch 5: Thế Trận |
| `cc sales` | Ch 2, Ch 3 | Ch 6: Hư Thực |
| `cc client` | Ch 6, Ch 9 | Ch 10: Địa Hình |
| `cc agent` | Ch 7: Quân Tranh | Ch 9: Hành Quân |
| `cc devops` | Ch 7, Ch 12 | - |
| `cc analytics` | Ch 1, Ch 13 | Ch 4: Hình Thế |
| `cc monitor` | Ch 11: Cửu Địa | Ch 13: Dụng Gián |
| `cc content` | Ch 5: Thế Trận | - |

## Related Code Files

**Files to Create:**
- `docs/binh-phap-philosophy.md` - Main Binh Pháp documentation

**Files to Update:**
- `docs/CLI_REFERENCE.md` - Add link to Binh Pháp philosophy
- `docs/command-index.md` - Add "Binh Pháp Strategy" category
- `docs/getting-started.md` - Add reference to philosophy guide

## Implementation Steps

### Step 1: Create Main Philosophy Document
1. Write introduction explaining Binh Pháp relevance to agencies
2. Provide historical context (Sun Tzu → Vietnamese → Agency OS)
3. Explain how philosophy informs CLI design

### Step 2: Document All 13 Chapters
For each chapter:
1. **Chapter Title**: Vietnamese (Hán Việt) + Chinese characters + English
2. **Core Philosophy**: 2-3 paragraphs explaining the principle
3. **Agency Application**: How it applies to agency operations
4. **Mapped CLI Modules**: Which `cc` commands implement this philosophy
5. **Practical Example**: Real-world scenario with commands
6. **Key Quote**: Original Sun Tzu passage (Vietnamese + English)

### Step 3: Document WIN-WIN-WIN Framework
1. Explain the three-party alignment principle
2. Provide validation checklist
3. Show `cc strategy validate-win` command usage
4. Include examples of good vs bad deals

### Step 4: Create Practical Workflows
1. **Client Acquisition Workflow**:
   - Research phase (Ch 13: Intelligence)
   - Strategy phase (Ch 1: Planning)
   - Execution phase (Ch 3: Win Without Fighting)
   - Commands: `cc analytics research`, `cc strategy assess`, `cc sales proposal`

2. **Revenue Growth Workflow**:
   - Resource management (Ch 2: Waging War)
   - Market positioning (Ch 5: Strategic Advantage)
   - Commands: `cc revenue forecast`, `cc sales pipeline`

3. **Crisis Management Workflow**:
   - Survival tactics (Ch 11: Nine Terrains)
   - Commands: `cc monitor alerts`, `cc devops rollback`

4. **Market Expansion Workflow**:
   - Terrain analysis (Ch 10: Terrain)
   - Commands: `cc client research`, `cc strategy market-entry`

### Step 5: Cross-Reference Integration
1. Update CLI_REFERENCE.md with link to philosophy doc
2. Add Binh Pháp category to command-index.md
3. Reference philosophy in getting-started.md introduction

### Step 6: Add Vietnamese Glossary
1. Create glossary of key Vietnamese military terms
2. Provide phonetic pronunciation guide
3. Include cultural context notes

## Todo List

- [x] Step 1: Create main philosophy document structure
- [x] Step 2: Document all 13 chapters (13 sub-tasks)
- [x] Step 3: Document WIN-WIN-WIN framework
- [x] Step 4: Create practical workflows (4 sub-tasks)
- [x] Step 5: Cross-reference integration
- [x] Step 6: Add Vietnamese glossary

## Success Criteria

- [x] All 13 chapters documented with philosophy + CLI mapping
- [x] WIN-WIN-WIN framework fully explained
- [x] 4 practical workflows with command examples
- [x] Vietnamese terminology preserved with translations
- [x] Cross-references added to other docs
- [x] Cultural authenticity maintained
- [x] Actionable guidance (not just theory)

## Risk Assessment

**Medium Risk:**
- Cultural misrepresentation (need accuracy in translations)
- Over-complexity (philosophy might intimidate users)

**Mitigation:**
- Consult Vietnamese cultural references for accuracy
- Keep language accessible with clear English translations
- Focus on practical application over academic theory
- Provide "Quick Start" section for those who want to skip philosophy

## Security Considerations

- None (documentation only)
- Ensure cultural sensitivity and accuracy

## Next Steps

After completion → Phase 4: Final Verification & Polish (create this phase)
