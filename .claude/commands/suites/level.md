---
description: 🎚️ Level Command - Set coding output style
argument-hint: [0-5|:show]
---

## Mission

Switch between coding levels from ELI5 to GOD mode.

## Levels

| Level | Name | Description |
|-------|------|-------------|
| 0 | ELI5 | Explain Like I'm 5 |
| 1 | Junior | Clear and educational |
| 2 | Mid | Standard professional |
| 3 | Senior | Efficient and robust |
| 4 | Lead | Architectural |
| 5 | **GOD** | Maximum performance |

## Quick Examples

```bash
/level                # Show current level
/level:show           # Show all levels
/level 0              # Set to ELI5
/level 5              # Set to GOD mode
```

## Level Characteristics

### Level 0: ELI5
- Comments: Extensive, simple language
- Variables: Very descriptive
- Complexity: Minimal
- Use: Teaching, beginners

### Level 5: GOD
- Comments: Only when necessary
- Variables: Optimal, context-aware
- Complexity: Maximum, cutting-edge
- Use: Performance critical

## Python Integration

```python
# turbo
from antigravity.core.coding_level import set_level, get_level, print_levels

# Set level
set_level(5)  # GOD mode
print(f"Current: {get_level().name}")

# Show all levels
print_levels()
```

---

🎚️ **From ELI5 to GOD mode in one command**
