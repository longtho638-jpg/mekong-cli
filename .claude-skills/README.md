# Claude Skills Registry

Unified skill system for .claude and AgencyOS integration.

## Structure
```
.claude-skills/
├── registry.json          # Skill registry
├── skill-name/           # Individual skill directory
│   ├── SKILL.md         # Claude skill definition
│   ├── implementation.py # Python implementation
│   ├── tests/           # Test files
│   ├── docs/            # Documentation
│   ├── scripts/         # Utility scripts
│   └── references/      # Reference materials
```

## Usage

Skills are automatically discovered by Claude agents and can be activated using:

```
/skill skill-name
```

## Development

When adding new skills:
1. Create directory under .claude-skills/
2. Add SKILL.md with proper definition
3. Add implementation files
4. Update registry.json (optional - auto-generated)
