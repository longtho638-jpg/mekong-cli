# Instructor Skill

This skill demonstrates structured output generation using `google-genai` (which has native Pydantic support, similar to what `instructor` provides for other providers).

## Features

- **Structured Output**: Extracts Pydantic models from natural language.
- **Type Safety**: Ensures outputs match the defined schema.
- **Gemini Integration**: Uses `gemini-2.0-flash-exp` (or compatible) for high-speed extraction.

## Usage

Run the skill using the python script directly or import `run_extraction_task`.

```bash
python .agent/skills/instructor/skill.py "Alice is 20 and likes painting."
```

## Requirements

- `google-genai`
- `pydantic`
- `GEMINI_API_KEY`
