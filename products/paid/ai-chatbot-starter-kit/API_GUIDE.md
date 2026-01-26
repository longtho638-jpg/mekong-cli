# API Reference Guide

Base URL: `http://localhost:8000/api/v1`

## Authentication
(Currently open for development. For production, uncomment the auth middleware in `main.py` and set up API Keys.)

## Chat Endpoints

### `POST /chat/stream`
Stream a chat response from the LLM.

**Request Body:**
```json
{
  "messages": [
    {"role": "user", "content": "Hello world"}
  ],
  "conversation_id": "optional-uuid-for-history",
  "provider": "openai",  // or "anthropic", "google"
  "model": "gpt-3.5-turbo",
  "stream": true
}
```

**Response:**
Server-Sent Events (SSE) stream.
- `data: <token>`
- `data: [DONE]`

## Document Endpoints

### `POST /documents/upload/text`
Index raw text.

**Request Body:**
```json
{
  "content": "Text to index...",
  "metadata": {"source": "manual"}
}
```

### `POST /documents/upload/file`
Index a file.

**Form Data:**
- `file`: (Binary) .txt or .md file.

### `POST /documents/search`
Search the knowledge base.

**Request Body:**
```json
{
  "query": "What is Antigravity?",
  "k": 3
}
```

## History Endpoints

### `GET /history/{conversation_id}`
Retrieve full chat history.

### `DELETE /history/{conversation_id}`
Clear chat history.
