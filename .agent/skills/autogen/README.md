# AutoGen Skill

This skill integrates Microsoft's [AutoGen](https://microsoft.github.io/autogen/) framework into the Antigravity Agent system. It allows for multi-agent conversation and task solving.

## Features

- **Multi-Agent Orchestration**: Supports AssistantAgent and UserProxyAgent interactions.
- **LLM Configuration**: Automatically detects `GEMINI_API_KEY` (preferred) or `OPENAI_API_KEY`.
- **Code Execution**: Configured to run code in a local `coding` directory (Docker disabled by default for compatibility).

## Usage

Run the skill using the python script directly or import `run_autogen_task` in your agent code.

```bash
python .agent/skills/autogen/skill.py "Your task here"
```

## Requirements

- `autogen-agentchat`
- `autogen-ext`
- Valid API Key (`GEMINI_API_KEY` or `OPENAI_API_KEY`)
