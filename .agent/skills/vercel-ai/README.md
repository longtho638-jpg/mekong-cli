# Vercel AI SDK Skill

This skill integrates the [Vercel AI SDK](https://sdk.vercel.ai/docs) into the Antigravity system. It is a TypeScript/JavaScript library for building AI-powered applications.

## Features

- **Unified API**: Works with OpenAI, Anthropic, Google (Gemini), and more.
- **Structured Data**: Uses Zod for schema validation.
- **React Hooks**: `useChat` and `useCompletion` for frontend integration.
- **RAG Support**: Helpers for streaming and retrieval.

## Usage

This skill is primarily used within the Next.js/React applications in this monorepo (`apps/dashboard`, `apps/docs`).

### Example (Server Action)

```typescript
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function askGemini(prompt: string) {
  const { text } = await generateText({
    model: google('gemini-1.5-flash'),
    prompt: prompt,
  });
  return text;
}
```

## Requirements

- `ai`
- `@ai-sdk/google`
- `zod`
- `GEMINI_API_KEY` (in `.env`)
