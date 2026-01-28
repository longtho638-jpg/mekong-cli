# AI/LLM Integration Guide (IPO-058)

## Overview
This module provides a unified interface for interacting with Large Language Models (LLMs) like Google Gemini, OpenAI, and Anthropic. It abstracts the provider differences and offers high-level services for text generation, chat, and structured content creation.

## Architecture

### 1. Unified LLM Service
Located at `backend/services/llm/service.py`, the `LLMService` acts as a facade.
- **Providers**: Adapter pattern implemented in `backend/services/llm/provider.py`.
- **Supported Providers**:
    - **Gemini**: `google-genai` (Default)
    - **OpenAI**: `openai` (Optional)
    - **Anthropic**: Placeholder for future support.

### 2. Content Service
Located at `backend/services/llm/content.py`, this service uses the `LLMService` to generate structured content:
- **Blog Posts**: SEO-optimized articles with specific tones and lengths.
- **Social Media Captions**: Short, engaging posts for platforms like LinkedIn, Twitter.
- **SEO Optimization**: Rewriting content for better search engine visibility.

### 3. API Layer
Router at `backend/api/routers/llm.py` exposes endpoints:
- `POST /api/v1/llm/generate`: Simple text generation.
- `POST /api/v1/llm/chat`: Chat with history.
- `POST /api/v1/llm/stream`: Server-Sent Events (SSE) stream.
- `POST /api/v1/llm/content/blog`: Generate blog posts (supports dynamic prompts).
- `POST /api/v1/llm/content/social`: Generate social captions (supports dynamic prompts).
- `POST /api/v1/llm/content/seo`: Optimize content (supports dynamic prompts).
- `POST /api/v1/llm/rag/ingest`: Ingest documents for RAG.
- `POST /api/v1/llm/rag/query`: Query the RAG system.

Router at `backend/api/routers/prompts.py` exposes endpoints for managing prompts:
- `GET /api/v1/prompts/`: List all prompts.
- `POST /api/v1/prompts/`: Create a new prompt.
- `GET /api/v1/prompts/{slug}`: Get a specific prompt.
- `PUT /api/v1/prompts/{prompt_id}`: Update a prompt.
- `DELETE /api/v1/prompts/{prompt_id}`: Delete a prompt.

### 4. RAG Architecture (Retrieval-Augmented Generation)
Located at `backend/services/rag/service.py`:
- **Embeddings**: Uses `GeminiEmbeddings` or `OpenAIEmbeddings` to vectorize text.
- **Vector Store**: Currently uses `InMemoryVectorStore` (extensible to Chroma/Pinecone).
- **Flow**:
  1. **Ingest**: Text -> Embeddings -> Vector Store.
  2. **Query**: User Question -> Embed -> Similarity Search -> Context.
  3. **Generate**: Context + Question -> LLM -> Answer.

### 5. Dynamic Prompt Management
Located at `backend/services/llm/prompt_service.py`:
- Allows changing system prompts without code deployment.
- **Database**: Stores prompts in `prompts` table with versioning.
- **Fallback**: `ContentService` checks DB for a prompt (by slug). If not found, it falls back to hardcoded `PromptTemplates` in `backend/services/llm/prompts.py`.
- **Supported Slugs**:
  - `blog-post-generator`
  - `social-media-caption`
  - `seo-optimizer`

## Configuration


Settings in `backend/api/config/settings.py`:

```python
google_api_key: Optional[str]
openai_api_key: Optional[str]
default_llm_provider: str = "gemini" # or "openai"
default_llm_model: str = "gemini-1.5-flash"
```

## Usage

### Backend
```python
from backend.services.llm.service import LLMService

service = LLMService()
response = await service.generate_text("Explain quantum computing")
```

### Frontend
The Admin Dashboard (`/ai`) provides a UI for:
- **AI Chat**: Interactive chat interface.
- **Content Studio**: Form-based content generation.
- **Prompt Library**: Manage system prompts and templates dynamically.

## Binh Pháp Integration
- **Ch.11 九地 (Nine Grounds)**: Adaptation to new terrain. AI allows the agency to adapt content strategy rapidly and scale operations without proportional headcount increase.
