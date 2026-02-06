# MEKONG-CLI ARCHITECTURE NOTES

> DNA extracted from ClaudeKit Engineer v2.9.1+

## 1. CORE PATTERNS

### Agent Structure

ClaudeKit agents follow **Plan-Execute-Verify** pattern:

1. **Plan**: Parse input, identify tasks
2. **Execute**: Run tasks with tool calls
3. **Verify**: Validate output, retry if needed

### Modular Design

- Each agent is self-contained in a folder
- Dependencies injected via config
- Skills loaded dynamically

## 2. TOOL CALL PATTERN

```python
# Pattern from ClaudeKit
class AgentBase:
    def plan(self, input: str) -> List[Task]:
        """Parse input into task list"""
        pass

    def execute(self, task: Task) -> Result:
        """Execute single task"""
        pass

    def verify(self, result: Result) -> bool:
        """Validate result"""
        pass

    def run(self, input: str):
        tasks = self.plan(input)
        for task in tasks:
            result = self.execute(task)
            if not self.verify(result):
                result = self.execute(task)  # Retry
        return results
```

## 3. PROMPT MANAGEMENT

- Prompts stored as Markdown files
- Dynamic variable injection via `{variable}`
- Chain-of-thought reasoning built-in

## 4. COMMANDS STRUCTURE

| Command   | Pattern                          |
| --------- | -------------------------------- |
| `/plan`   | Strategic planning with research |
| `/cook`   | Implementation execution         |
| `/review` | Code review pipeline             |
| `/test`   | Test execution                   |

## 5. KEY DIFFERENCES FOR MEKONG

| ClaudeKit   | Mekong-CLI          |
| ----------- | ------------------- |
| Node.js     | Python (Typer/Rich) |
| Agent Hooks | Recipe Parser       |
| MCP Tools   | OpenClaw API        |

---

_Extracted: 2026-02-06 | Source: claudekit-engineer-dna_
