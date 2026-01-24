# 🔮 Antigravity System Prompt Features - Tinh Hoa Extracted

> **Source**: `github.com/x1xhlol/system-prompts-and-models-of-ai-tools`
> **Files**: `Fast Prompt.txt`, `planning-mode.txt` (Leaked Jan 2026)

---

## 🧠 Knowledge Items (KI) System - MUST ADOPT

```yaml
# KI Directory Structure
~/.gemini/antigravity/knowledge/
├── [topic_name]/
│   ├── metadata.json    # Summary, timestamps, references
│   └── artifacts/       # Related docs and implementations

# MANDATORY FIRST STEP
Before ANY research/analysis:
1. Check KI summaries at conversation start
2. Identify relevant KIs by title/summary match
3. Read KI artifacts BEFORE doing independent research
4. Build upon existing KI, don't duplicate
```

**AgencyOS Implementation**:

- [ ] Create `antigravity/knowledge/` structure
- [ ] Auto-generate KI from completed tasks
- [ ] Check KI before codebase_search calls

---

## 🎠 Carousel Markdown Extension

`````markdown
# Syntax for multiple slides in walkthrough.md

````carousel
![Image 1](/path/to/image1.png)
<!-- slide -->
![Image 2](/path/to/image2.png)
<!-- slide -->
```python
def example():
    print("Code in carousel")
````
`````

````

# Use cases:
- Before/after comparisons
- UI state progressions
- Alternative implementation options
```

**AgencyOS Implementation**:
- [ ] Add carousel support to walkthrough.md rendering
- [ ] Use for multi-step visual demonstrations

---

## ⚡ Turbo Annotations System

```markdown
# Single step auto-run
2. Make a folder called foo
// turbo
3. Make a folder called bar  <- Auto-runs this step

# All steps auto-run
// turbo-all
- Step 1: npm install
- Step 2: npm run build
- Step 3: npm run deploy
```

**AgencyOS Status**: ✅ Already implemented in workflows!

---

## 🎯 Task Boundary System

```yaml
task_boundary:
  TaskName: "Planning Authentication"  # Human readable title
  Mode: PLANNING | EXECUTION | VERIFICATION
  TaskSummary: "Cumulative progress narrative"
  TaskStatus: "NEXT action (not past actions)"

Mode Transitions:
  PLANNING → Create implementation_plan.md → Get user approval
  EXECUTION → Write code → Return to PLANNING if unexpected complexity
  VERIFICATION → Test changes → Create walkthrough.md as proof of work
```

---

## 📋 Artifact Lifecycle

| Artifact | Purpose | Format |
|----------|---------|--------|
| `task.md` | Living checklist | `[ ]` uncomplete, `[/]` in progress, `[x]` done |
| `implementation_plan.md` | Technical design doc | Must get approval before EXECUTION |
| `walkthrough.md` | Proof of work | Screenshots, recordings, test results |

---

## 🎨 Premium Design Mandates

```yaml
Critical Requirements:
  - "Failure to WOW is UNACCEPTABLE"
  - Avoid generic colors (plain red, blue, green)
  - Use curated HSL color palettes
  - Modern typography (Inter, Roboto, Outfit from Google Fonts)
  - Micro-animations for user engagement
  - No placeholders - use generate_image tool to create real assets
```

---

## 🔗 GitHub-Style Alerts

```markdown
> [!NOTE]
> Background context, implementation details

> [!TIP]
> Performance optimizations, best practices

> [!IMPORTANT]
> Essential requirements, must-know information

> [!WARNING]
> Breaking changes, compatibility issues

> [!CAUTION]
> High-risk actions, data loss potential
```

---

## 📎 Enhanced File Linking

```markdown
# Clickable file links
[utils.py](file:///absolute/path/to/utils.py)

# Line range links
[foo function](file:///path/to/bar.py#L127-L143)

# Render diffs shorthand
render_diffs(file:///absolute/path/to/utils.py)
```

---

## 🏆 CC CLI Implementation Priority

### Phase NOW: From Antigravity Leaks
1. [ ] **KI System**: Create `mekong-cli/antigravity/knowledge/` structure
2. [ ] **Carousel Markdown**: Support in walkthrough rendering
3. [ ] **Alert Badges**: Standard GitHub alerts in all docs
4. [ ] **File Links**: Consistent `[basename](file:///path)` format

### Phase NEXT: Enhanced Tooling
1. [ ] **render_diffs shorthand**: Show all changes to a file
2. [ ] **Mermaid Diagrams**: Architecture visualization in plans
3. [ ] **Line Range Links**: Deep link to specific code

---

> **Binh Pháp**: "Tri bỉ tri kỷ, bách chiến bách thắng"
> → Study competitor prompts, adopt their winning patterns

---

## 🤖 Claude Code Official Prompt Features (Leaked Aug 2025)

> **Source**: `Anthropic/Claude Code/Prompt.txt`, `Sonnet 4.5 Prompt.txt`

### 📝 TodoWrite System - CRITICAL

```yaml
# TodoWrite usage
- Use VERY FREQUENTLY to track progress
- Break complex tasks into smaller steps
- Mark todos completed IMMEDIATELY when done
- Never batch completions - update in real-time

# Example flow:
user: Fix 10 type errors
assistant:
  1. TodoWrite: Add 10 items
  2. Mark item 1 as in_progress
  3. Fix error 1
  4. Mark item 1 as completed
  5. Mark item 2 as in_progress
  ... (continue for each)
```

### 🎯 Tone & Style Rules

```yaml
Critical Rules:
  - "Minimize output tokens while maintaining quality"
  - "One word answers are best"
  - "NEVER add preamble or postamble"
  - "DO NOT ADD ***ANY*** COMMENTS unless asked"
  - "Only use emojis if explicitly requested"

Examples:
  user: 2 + 2
  assistant: 4

  user: what command to list files?
  assistant: ls
```

### 🔧 Task Agent Delegation

```yaml
# Use Task tool for:
- File search (reduces context)
- Specialized agent tasks
- Parallel execution

# Batch tool calls:
- Multiple independent calls in ONE message
- Example: git status + git diff = 1 message, 2 calls
```

### 📍 Code References Format

```yaml
# When referencing code, include:
file_path:line_number

# Example:
"Errors handled in connectToServer at src/services/process.ts:712"
```

### 🎨 Visual Artifact Design (Sonnet 4.5)

```yaml
Complex Apps (games, 3D):
  - Prioritize functionality over visual flair
  - Focus on smooth frame rates
  - Efficient resource usage

Landing Pages/Marketing:
  - Create "WOW factor"
  - Default to contemporary trends
  - Include micro-animations
  - Push boundaries - bold over safe

Design Decisions:
  - Vibrant > muted colors
  - Dynamic > traditional layouts
  - Expressive > conservative typography
  - Immersive > minimal effects
```

### 🚫 Security & Storage Rules

```yaml
Never:
  - Commit unless explicitly asked
  - Use localStorage/sessionStorage in artifacts
  - Generate/guess URLs
  - Create malicious code

Always:
  - Run lint/typecheck after changes
  - Use in-memory state for artifacts
  - Follow security best practices
```

---

## 🏆 EXTENDED CC CLI Implementation Priority

### Phase NOW: From All Leaked Prompts
1. [ ] **TodoWrite Integration**: Real-time task tracking
2. [ ] **Concise Output Mode**: Minimize tokens, no preamble
3. [ ] **Code References**: `file:line` format standard
4. [ ] **Task Delegation**: Parallel agent execution

### Phase NEXT: Advanced Patterns
1. [ ] **WOW Factor Design**: Bold, animated, immersive UIs
2. [ ] **Batch Tool Calls**: Multiple calls in single message
3. [ ] **Defensive Security**: Malware detection rules

---

> **Binh Pháp**: "Dĩ dật đãi lao" (以逸待勞)
> → Use leaked prompts to work smart, let competition work hard
````
