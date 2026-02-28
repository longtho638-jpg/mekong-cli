# DEEP TECH PRD: PROJECT "AGENCY-GENESIS"

**Core Concept:** Vibe Coding Automation  
**DNA Source:** `claudekit.cc` (Licensed)  
**Executor:** Claude Code CLI (Anthropic)  
**Orchestrator:** Google Antigravity (Project IDX)  
**Output:** AgencyOS Open Source Agents

---

## 1. ARCHITECTURE TOPOLOGY (The Trinity Model)

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENCY-GENESIS TRINITY                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │   BRAIN     │    │   HANDS     │    │     PULSE       │ │
│  │ ClaudeKit   │───▶│ Claude Code │◀───│   Antigravity   │ │
│  │    DNA      │    │    CLI      │    │   Supervisor    │ │
│  └─────────────┘    └─────────────┘    └─────────────────┘ │
│       │                   │                   │            │
│  System Prompts     Read/Write Code      Auto-Approve     │
│  Tool Definitions   Git Commit           Feed Context     │
│  Workflow Logic     Terminal Exec        Error Recovery   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. DNA EXTRACTION & INJECTION PROTOCOL

### Phase 1: DNA Extraction (Trích xuất từ ClaudeKit)

- **Source:** Phân tích `claudekit/prompts` và `claudekit/tools`
- **Action:**
  - Trích xuất **System Persona**: Coding Agent definition
  - Trích xuất **Thinking Process**: Chain-of-Thought steps

### Phase 2: DNA Injection (Tiêm vào Claude Code)

**Mapping 1: Memory Injection (`CLAUDE.md`)**

```markdown
# AgencyOS Builder Persona

Tuân thủ kiến trúc ClaudeKit. Mọi code phải:

- Follow project structure patterns
- Handle errors gracefully
- Write tests before implementation
```

**Mapping 2: Skill Injection (MCP Servers)**

- ClaudeKit tools → MCP Server bridge
- Claude Code CLI → Native MCP calls

---

## 3. THE AUTONOMOUS LOOP (State Machine)

```
┌────────────────┐
│ 1. VIBE_INPUT  │ ◀──── User Intent ("Build Lead Gen module")
└───────┬────────┘
        ▼
┌────────────────┐
│ 2. CONTEXT_    │ ◀──── Load ClaudeKit DNA, compress into prompt
│    LOADING     │
└───────┬────────┘
        ▼
┌────────────────┐
│ 3. CLAUDE_     │ ◀──── Execute: claude "Build module..." --print-output
│    EXECUTION   │ ◀──── Auto-Approve safe operations (pexpect)
└───────┬────────┘
        ▼
┌────────────────┐
│ 4. VERIFY &    │ ◀──── Error? → Feed back to Claude
│    RECURSION   │ ◀──── Success? → Git Commit
└───────┬────────┘
        │
        └──────────▶ Loop back to Step 1
```

### Auto-Approve Logic

```python
# Safe operations (AUTO 'y')
- Create new files
- Modify existing code files
- Run npm/pip install
- Git add/commit

# Blocked operations (REQUIRE MANUAL)
- Delete entire directories
- Modify system files
- Deploy to production
```

---

## 4. SUPERVISOR SCRIPT (genesis.py)

```python
#!/usr/bin/env python3
"""
AGENCY-GENESIS: The Self-Replicating Code Controller
"""
import subprocess
import pexpect
import yaml

class AgencyGenesis:
    def __init__(self):
        self.dna_path = "claudekit_dna/"
        self.manifest = self.load_manifest()

    def load_manifest(self):
        with open("vibe_manifest.yaml") as f:
            return yaml.safe_load(f)

    def inject_dna(self, task):
        """Load relevant ClaudeKit patterns for task"""
        # Find matching DNA patterns
        # Compress into context
        pass

    def execute_claude(self, prompt):
        """Run Claude Code CLI with auto-approve"""
        child = pexpect.spawn(f'claude "{prompt}"')

        while True:
            index = child.expect([
                r'\(y/n\)',      # Permission prompt
                pexpect.EOF,
                pexpect.TIMEOUT
            ], timeout=300)

            if index == 0:
                child.sendline('y')  # Auto-approve
            elif index == 1:
                break  # Done

    def run_loop(self):
        """Main autonomous loop"""
        for task in self.manifest['tasks']:
            context = self.inject_dna(task)
            prompt = f"{context}\n\nTask: {task['description']}"
            self.execute_claude(prompt)

if __name__ == "__main__":
    genesis = AgencyGenesis()
    genesis.run_loop()
```

---

## 5. REPO STRUCTURE (Target)

```
agency-os/
├── .idx/                  # Antigravity config
├── .claude/               # Claude Code config
│   ├── settings.json
│   └── rules/             # Custom rules
├── CLAUDE.md              # DNA của ClaudeKit (Luật chơi)
├── genesis.py             # Supervisor (Controller)
├── vibe_manifest.yaml     # User Intent Input
├── claudekit_dna/         # Source code gốc (Read-only)
│   ├── prompts/
│   ├── tools/
│   └── patterns/
├── mcp_server.py          # MCP Bridge for ClaudeKit tools
└── src/                   # AgencyOS được sinh ra
    ├── agents/
    ├── core/
    └── modules/
```

---

## 6. VIBE MANIFEST FORMAT

```yaml
# vibe_manifest.yaml
version: "1.0"
project: "AgencyOS"
dna_source: "./claudekit_dna"

tasks:
  - id: "module-1"
    description: "Tạo cấu trúc Next.js dựa trên ClaudeKit"
    priority: HIGH
    auto_approve: true

  - id: "module-2"
    description: "Build Lead Gen agent cho thị trường VN"
    priority: MEDIUM
    dna_reference: "claudekit_dna/modules/lead-gen"

  - id: "module-3"
    description: "Tạo test suite và CI/CD pipeline"
    priority: HIGH
    auto_approve: true
```

---

## 7. ACTIVATION SEQUENCE

```bash
# Step 1: Clone ClaudeKit into environment
git clone <claudekit-repo> claudekit_dna/

# Step 2: Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Step 3: Create vibe_manifest.yaml
echo "tasks: [{description: 'Init project structure'}]" > vibe_manifest.yaml

# Step 4: Launch Genesis
python genesis.py

# 🚀 Self-Replicating Code is now ACTIVE
```

---

## 8. INTEGRATION WITH MEKONG-CLI

```
mekong-cli/
├── packages/
│   └── vibe-dev/          # Uses Genesis patterns
├── scripts/
│   └── genesis.py         # Supervisor script
├── claudekit_dna/         # DNA source
└── CLAUDE.md              # Injected DNA
```

---

_This is the Meta-Loop that enables Vibe Coding at Industrial Scale_
