# IPO-058: AI/LLM Integration Plan (Ch.11 九地)

## Overview
- **Goal**: Implement comprehensive AI/LLM capabilities including Unified LLM Service, Content Generation, and Chatbot Infrastructure.
- **Phase**: 2 (8/8)
- **Status**: In Progress
- **Chapter**: 11 九地 (Nine Grounds - Adaptation)

## Objectives
1.  **Unified LLM Layer**: Abstraction over Gemini, Claude, OpenAI.
2.  **Content Engine**: Blog post generation, social media captions, SEO optimization.
3.  **Chat Infrastructure**: RAG-ready chatbot backend.
4.  **Admin UI**: Prompt management, Generation Playground, Chat history.

## Architecture
- **Service**: `backend/services/llm/`
    - `provider.py`: Adapter pattern for LLM providers.
    - `service.py`: Core logic (generate, chat, stream).
    - `content.py`: Content generation specific logic.
    - `rag.py`: Simple RAG implementation (optional/foundational).
- **API**: `backend/api/routers/llm.py`
- **UI**: `apps/admin/app/ai/`
    - `page.tsx`: Dashboard.
    - `prompts/page.tsx`: Prompt engineering.
    - `chat/page.tsx`: Chat interface.

## Implementation Steps
1.  [ ] **Phase 1: Backend Services** - `LLMService`, `ProviderFactory`.
2.  [ ] **Phase 2: API Layer** - Router with streaming support.
3.  [ ] **Phase 3: Frontend UI** - Admin Dashboard for AI.
4.  [ ] **Phase 4: Testing & Documentation**.

## Dependencies
- `google-genai` (already in env)
- `openai` (optional)
- `anthropic` (optional)
- `backend/config/settings.py`

## WIN-WIN-WIN
- **Owner**: Nuclear Weaponization of content/support.
- **Agency**: High-value service offering (AI Automation).
- **Client**: 24/7 Support and Content Scale.
