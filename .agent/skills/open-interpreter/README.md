# Open Interpreter Skill

This skill integrates [Open Interpreter](https://github.com/openinterpreter/open-interpreter) into the Antigravity Agent system. It allows the agent to run code (Python, JavaScript, Shell, etc.) on the local machine to solve tasks.

## Features

- **Code Execution**: capable of writing and executing code locally.
- **Multi-language**: Supports Python, Shell, JavaScript, etc.
- **Gemini Integration**: Configured to use `gemini-1.5-flash` for speed and cost.

## Usage

Run the skill using the python script directly or import `run_interpreter_task`.

```bash
python .agent/skills/open-interpreter/skill.py "Convert this image to grayscale"
```

## Requirements

- `open-interpreter`
- `GEMINI_API_KEY`
