# Agno Skill

This skill integrates [Agno](https://github.com/agno-agi/agno) (formerly PhiData) into the Antigravity Agent system. Agno is a lightweight, high-performance framework for building multi-modal agents.

## Features

- **Gemini Integration**: Uses `gemini-1.5-flash` via `agno.models.google`.
- **Fast Instantiation**: Leverages Agno's efficient architecture.
- **Markdown Support**: Agents return formatted markdown.

## Usage

Run the skill using the python script directly or import `run_agno_agent` in your agent code.

```bash
python .agent/skills/agno/skill.py "Explain the benefits of Agno framework"
```

## Requirements

- `agno`
- `GEMINI_API_KEY`
