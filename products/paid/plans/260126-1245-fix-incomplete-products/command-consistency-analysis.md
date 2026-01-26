# Command Consistency Analysis - Mekong CLI vs ClaudeKit

**Analysis Date:** 2026-01-26
**Scope:** `docs/getting-started.md` + `docs/CLI_REFERENCE.md`
**Purpose:** Identify command pattern inconsistencies with ClaudeKit standards

---

## Executive Summary

**Status:** ⚠️ SIGNIFICANT INCONSISTENCIES FOUND

The Mekong CLI uses a **dual-language, dual-paradigm** command structure that deviates from standard ClaudeKit conventions:

1. **Vietnamese naming** (mekong, Agency OS terminology)
2. **Slash commands** (/cook, /quote, /win3, /proposal, /antigravity)
3. **CC CLI module system** (cc revenue, cc sales, cc content, etc.)

**Recommendation:** Standardize on a single paradigm aligned with ClaudeKit best practices.

---

## 1. Command Paradigm Comparison

### Getting Started Commands (Vietnamese Paradigm)

| Command | Description | Paradigm |
|---------|-------------|----------|
| `mekong init` | Initialize workspace | Custom CLI |
| `mekong setup-vibe` | Setup VIBE workflow | Custom CLI |
| `mekong run-scout` | Scout codebase | Custom CLI |
| `/cook` | Implement feature | Slash command |
| `/quote` | Generate quote | Slash command |
| `/win3` | WIN-WIN-WIN validation | Slash command |
| `/proposal` | Generate proposal | Slash command |
| `/antigravity` | Quantum activation | Slash command |

### CLI Reference Commands (CC Module System)

| Module | Command Pattern | Example |
|--------|----------------|---------|
| `revenue` | `cc revenue <subcommand>` | `cc revenue summary` |
| `sales` | `cc sales <subcommand>` | `cc sales pipeline` |
| `content` | `cc content <subcommand>` | `cc content ideas` |
| `agent` | `cc agent <subcommand>` | `cc agent spawn` |
| `devops` | `cc devops <subcommand>` | `cc devops deploy` |
| `client` | `cc client <subcommand>` | `cc client add` |
| `release` | `cc release <subcommand>` | `cc release create` |
| `analytics` | `cc analytics <subcommand>` | `cc analytics dashboard` |
| `monitor` | `cc monitor <subcommand>` | `cc monitor health` |

### ClaudeKit Standard Pattern (Expected)

| Pattern | Description | Example |
|---------|-------------|---------|
| `claude <verb> <noun>` | Standard CLI | `claude create plan` |
| `claude <module> <command>` | Module-based | `claude revenue summary` |
| `/slash-command` | Built-in shortcuts | `/commit`, `/test` |

---

## 2. Inconsistencies Identified

### 2.1 Mixed Command Prefixes

**Issue:** Three different command entry points coexist

```bash
# Entry Point 1: mekong CLI
mekong init
mekong setup-vibe
mekong run-scout

# Entry Point 2: Slash commands
/cook
/quote
/win3

# Entry Point 3: CC module system
cc revenue summary
cc sales pipeline
cc content ideas
```

**ClaudeKit Standard:**
```bash
# Single entry point
claude <action> [options]
/shortcut  # Only for built-in Claude features
```

**Severity:** 🔴 HIGH - User confusion, poor discoverability

---

### 2.2 Vietnamese vs English Terminology

**Issue:** Inconsistent language in command names

| Vietnamese | English Equivalent | Usage |
|------------|-------------------|-------|
| `/cook` | `/implement` | Feature implementation |
| `/win3` | `/validate-win` | WIN-WIN-WIN check |
| `mekong` | `claude` or `kit` | CLI executable name |
| Agency OS | AgencyKit | Product name |

**ClaudeKit Standard:**
- English commands only
- Domain-specific terms allowed (e.g., `revenue`, `sales`)
- No cultural/linguistic barriers

**Severity:** 🟡 MEDIUM - Internationalization concern, but culturally significant

---

### 2.3 Slash Command Overloading

**Issue:** Slash commands overlap with CC module functionality

| Slash Command | CC Module Equivalent | Overlap |
|---------------|---------------------|---------|
| `/quote` | `cc sales quote` (hypothetical) | ❌ Not in CLI_REFERENCE |
| `/proposal` | `cc sales proposal` (hypothetical) | ❌ Not in CLI_REFERENCE |
| `/cook` | Workflow orchestrator | ⚠️ Different paradigm |

**ClaudeKit Standard:**
- Slash commands reserved for built-in IDE features
- Domain commands use module system

**Severity:** 🟡 MEDIUM - Architectural confusion

---

### 2.4 Missing Documentation Links

**Issue:** Getting-started.md references commands not in CLI_REFERENCE.md

| Command | Found in Getting-Started? | Found in CLI Reference? |
|---------|---------------------------|------------------------|
| `/cook` | ✅ | ❌ |
| `/quote` | ✅ | ❌ |
| `/win3` | ✅ | ❌ |
| `/proposal` | ✅ | ❌ |
| `/antigravity` | ✅ | ❌ |
| `mekong init` | ✅ | ❌ |
| `mekong setup-vibe` | ✅ | ❌ |
| `cc revenue` | ❌ | ✅ |
| `cc sales` | ❌ | ✅ |

**ClaudeKit Standard:**
- All commands documented in single reference
- Cross-references between docs

**Severity:** 🔴 HIGH - Documentation fragmentation

---

## 3. Architectural Analysis

### Current Structure (Multi-Paradigm)

```
┌─────────────────────────────────────────────────┐
│  Entry Point 1: mekong CLI                     │
│  - mekong init, mekong setup-vibe, etc.        │
└─────────────────────────────────────────────────┘
         │
         ├──> Slash Commands (/cook, /quote, /win3)
         │
         └──> CC Module System (cc revenue, cc sales, etc.)
```

**Issues:**
- Three entry points confuse users
- No clear hierarchy between paradigms
- Overlapping responsibilities

### Recommended Structure (ClaudeKit-Aligned)

**Option A: Module-First**
```bash
# Primary: Module system
claude revenue summary
claude sales pipeline
claude content ideas

# Secondary: Shortcuts for frequent tasks
/implement  # Alias for workflow
/validate-win  # Alias for win3 check
```

**Option B: Namespace Isolation**
```bash
# Binh Phap namespace (preserve cultural identity)
claude binh-phap init
claude binh-phap validate-win

# Standard modules
claude revenue summary
claude sales pipeline

# Slash commands only for built-in features
/commit
/test
```

---

## 4. Specific Inconsistencies by Category

### 4.1 Naming Conventions

| Current | ClaudeKit Standard | Severity |
|---------|-------------------|----------|
| `mekong` | `claude` or `kit` | 🔴 HIGH |
| `/cook` | `/implement` | 🟡 MEDIUM |
| `/win3` | `/validate-win-win-win` | 🟢 LOW |
| `--metadata` JSON | `--config FILE` | 🟡 MEDIUM |

### 4.2 Argument Patterns

| Current | ClaudeKit Standard | Issue |
|---------|-------------------|-------|
| `cc content draft "topic"` | `claude content draft --topic "..."` | ✅ OK |
| `--platforms twitter,linkedin` | `--platform twitter --platform linkedin` | 🟡 MEDIUM |
| `--refresh 10` | `--refresh-interval 10` | 🟢 LOW |
| `--probability 0.5` | `--win-probability 0.5` | 🟡 MEDIUM |

### 4.3 Output Formats

| Current | ClaudeKit Standard | Issue |
|---------|-------------------|-------|
| `--format json\|csv\|table` | ✅ Standard | ✅ OK |
| Auto JSON for pipes | ✅ Standard | ✅ OK |
| Error JSON structure | ✅ Standard | ✅ OK |

### 4.4 Subcommand Structure

| Current | ClaudeKit Standard | Issue |
|---------|-------------------|-------|
| `cc sales leads list` | ✅ Nested subcommands | ✅ OK |
| `cc agent swarm deploy` | ✅ Nested subcommands | ✅ OK |
| `cc monitor logs tail` | ✅ Nested subcommands | ✅ OK |

---

## 5. Recommendations

### 5.1 Immediate Actions (Priority 1)

1. **Consolidate Documentation**
   - Merge all commands into CLI_REFERENCE.md
   - Add cross-references from getting-started.md
   - Create command index (alphabetical + by category)

2. **Standardize Entry Point**
   ```bash
   # Deprecate: mekong <command>
   # Standardize: claude <command> or kit <command>
   ```

3. **Map Slash Commands to Modules**
   ```bash
   # Document equivalence
   /cook       → claude workflow implement
   /quote      → claude sales quote
   /win3       → claude strategy validate-win
   /proposal   → claude sales proposal
   ```

### 5.2 Short-Term Actions (Priority 2)

4. **Create Alias System**
   ```bash
   # Preserve cultural commands as aliases
   alias /cook='claude workflow implement'
   alias /win3='claude strategy validate-win'
   alias mekong='claude binh-phap'
   ```

5. **Standardize Argument Names**
   - `--metadata` → `--config` or `--attributes`
   - `--probability` → `--win-probability`
   - `--platforms` → `--platform` (repeatable)

6. **Add Help Text Consistency**
   ```bash
   # All commands should support
   claude <module> --help
   claude <module> <command> --help
   claude --version
   claude --list-modules
   ```

### 5.3 Long-Term Actions (Priority 3)

7. **Create ClaudeKit Module Registry**
   - Binh Phap Strategy Module
   - Revenue Engine Module
   - Content Factory Module
   - Define standard module interface

8. **Internationalization Strategy**
   - Keep English as primary
   - Add `--lang vi` for Vietnamese help text
   - Preserve cultural commands as optional namespace

9. **Documentation Restructure**
   ```
   docs/
   ├── quick-start.md        # Getting started
   ├── CLI_REFERENCE.md      # All commands (single source of truth)
   ├── modules/
   │   ├── revenue.md
   │   ├── sales.md
   │   └── binh-phap.md     # Cultural module
   └── migration-guide.md    # Old → New commands
   ```

---

## 6. Migration Path

### Phase 1: Documentation Unification (Week 1-2)

- [ ] Create comprehensive CLI_REFERENCE.md with ALL commands
- [ ] Add deprecation warnings to getting-started.md for mekong commands
- [ ] Document command equivalences (slash → module)

### Phase 2: Alias Implementation (Week 3-4)

- [ ] Create bash/zsh aliases for backward compatibility
- [ ] Add `claude alias` command for user customization
- [ ] Update all examples in docs to use new commands

### Phase 3: Code Migration (Week 5-8)

- [ ] Refactor `main.py` to use `claude` as primary entry point
- [ ] Keep `mekong` as symlink/alias for backward compatibility
- [ ] Map slash commands to module equivalents internally

### Phase 4: Deprecation (Week 9-12)

- [ ] Add deprecation warnings to old commands
- [ ] Provide migration script for user configs
- [ ] Update all tutorials and videos

---

## 7. Compliance Scorecard

| Criterion | Current Status | Target Status |
|-----------|---------------|---------------|
| **Single Entry Point** | 🔴 Fail (3 entry points) | ✅ Pass (claude + aliases) |
| **English Commands** | 🟡 Partial (mixed) | ✅ Pass (English primary) |
| **Documentation Unified** | 🔴 Fail (fragmented) | ✅ Pass (single reference) |
| **Argument Consistency** | 🟡 Partial | ✅ Pass |
| **Help Text Coverage** | 🟢 Pass | ✅ Pass |
| **Error Handling** | 🟢 Pass | ✅ Pass |
| **Output Formats** | 🟢 Pass | ✅ Pass |

**Overall Score:** 🟡 43% Compliant (3/7 passing)
**Target Score:** 🟢 100% Compliant

---

## 8. Cultural Preservation Strategy

**Binh Pháp Philosophy Integration** (without breaking ClaudeKit standards):

1. **Create `binh-phap` Namespace**
   ```bash
   claude binh-phap strategy  # Chapter-based commands
   claude binh-phap validate-win  # WIN-WIN-WIN check
   claude binh-phap analyze   # Ngũ Sự analysis
   ```

2. **Keep Vietnamese Aliases Optional**
   ```bash
   # Users can enable Vietnamese mode
   claude config set language vi

   # Then use
   /nấu      # /cook
   /thắng3   # /win3
   ```

3. **Document Cultural Context**
   - Add `docs/binh-phap/README.md` explaining philosophy
   - Map 13 Chapters to CLI modules
   - Preserve Vietnamese terminology in comments/help text

---

## 9. Conclusion

**Key Findings:**

1. **Three competing paradigms** cause user confusion
2. **Documentation fragmentation** hides available features
3. **Cultural identity** can be preserved via namespacing
4. **Technical foundation is solid** (error handling, output formats)

**Primary Recommendation:**

Adopt **Option B: Namespace Isolation** strategy:
- Preserve Binh Pháp philosophy in dedicated namespace
- Standardize core modules to ClaudeKit patterns
- Provide migration path for existing users

**Impact:**
- 🚀 Better discoverability
- 🌍 International accessibility
- 🏯 Cultural preservation
- ✅ ClaudeKit compliance

**Next Steps:**

1. Review this analysis with team
2. Choose standardization strategy (Option A or B)
3. Create detailed migration plan
4. Begin Phase 1 (Documentation Unification)

---

**Analyst:** Claude Code CLI (Sonnet 4.5)
**Reviewed By:** Awaiting user approval
**Status:** ⏸️ PENDING DECISION
