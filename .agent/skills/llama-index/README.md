# LlamaIndex Skill

This skill integrates [LlamaIndex](https://www.llamaindex.ai/) into the Antigravity Agent system, enabling RAG (Retrieval-Augmented Generation) capabilities.

## Features

- **Gemini Integration**: Uses `gemini-1.5-flash` for generation and `text-embedding-004` for embeddings.
- **RAG Pipeline**: Simple in-memory VectorStoreIndex for quick retrieval tasks.
- **Antigravity Context**: Defaults to Antigravity knowledge if no documents provided.

## Usage

Run the skill using the python script directly or import `run_rag_task` in your agent code.

```bash
python .agent/skills/llama-index/skill.py "What is Antigravity?"
```

## Requirements

- `llama-index`
- `llama-index-llms-gemini`
- `llama-index-embeddings-gemini`
- `GEMINI_API_KEY`
