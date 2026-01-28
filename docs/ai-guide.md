# AI & LLM Integration Guide (IPO-058)

## Overview
The AI Integration layer empowers AgencyOS with Large Language Model capabilities, enabling features like automated content generation, intelligent customer support, and strategic business analysis.

## Models & Providers
- **Primary**: Gemini Pro (Google) - Optimized for cost and performance.
- **Fallback**: GPT-4 (OpenAI) - Used for complex reasoning or code generation tasks.
- **Routing**: `Antigravity Router` dynamically selects the best model based on task complexity and quota availability.

## Core Capabilities
1. **Content Generation**: Blog posts, social media captions, and email marketing copy.
2. **Chatbot Support**: 24/7 Level 1 support for common customer inquiries.
3. **Business Intelligence**: Natural language querying of analytics data ("What was our MRR growth last month?").
4. **Code Assistant**: Internal tooling for developers to scaffold features.

## Architecture
- **Service**: `backend/services/llm_service.py` handles provider abstraction, retries, and fallback logic.
- **Prompt Management**: `backend/services/prompt_service.py` manages system prompts stored in the database, allowing updates without code changes.
- **Vector Store**: PGVector (Supabase) used for RAG (Retrieval-Augmented Generation) to ground AI responses in business data.

## Configuration
- **API Keys**: Managed via `.env` (e.g., `GEMINI_API_KEY`, `OPENAI_API_KEY`).
- **Quotas**: Rate limits and usage quotas defined in `quota_server` to prevent cost overruns.

## Usage Example (Backend)
```python
from backend.services.llm_service import LLMService

llm = LLMService()
response = await llm.generate_text(
    prompt="Draft a welcome email for a new SaaS user.",
    provider="gemini"
)
```

## Security
- **PII Scrubbing**: All inputs are sanitized before being sent to external LLM providers.
- **Prompt Injection**: Input validation and strictly scoped system prompts prevent jailbreaking.
