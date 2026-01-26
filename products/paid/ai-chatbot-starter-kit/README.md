# Antigravity AI Chatbot Starter Kit 🚀

**Build Production-Ready AI Chatbots in Hours, Not Weeks.**

This starter kit provides a robust, scalable foundation for building AI-powered chat applications. It includes a FastAPI backend with RAG capabilities, a beautiful Next.js frontend, and everything you need to ship a real product.

## ✨ Features

- **Multi-LLM Support**: Seamlessly switch between OpenAI (GPT-4), Anthropic (Claude 3), and Google (Gemini).
- **RAG Pipeline**: Built-in document ingestion and retrieval using ChromaDB.
- **Real-time Streaming**: Smooth, type-writer effect responses using Server-Sent Events (SSE).
- **Conversation Memory**: Persistent chat history using Redis and PostgreSQL.
- **Production Ready**: Docker Compose setup, Rate limiting, and Cost tracking structure.
- **Modern UI**: Built with Next.js 14, Tailwind CSS, and shadcn/ui.

## 📂 Project Structure

```
.
├── backend/                # FastAPI Application
│   ├── app/
│   │   ├── models/         # Pydantic data models
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic (LLM, RAG, Memory)
│   │   └── main.py         # Entry point
│   └── Dockerfile
├── frontend/               # Next.js 14 Application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks (useChat, useStreaming)
│   │   └── app/            # App Router pages
│   └── Dockerfile
├── examples/               # Python client examples
│   ├── qa-bot/
│   ├── rag-assistant/
│   └── conversational-bot/
└── docker-compose.yml      # Local development orchestration
```

## 🚀 Quick Start

1.  **Prerequisites**: Ensure you have Docker and Docker Compose installed.
2.  **Environment Setup**:
    Copy the example env file (you may need to create one based on `backend/app/config.py` defaults or just rely on docker-compose environment vars).

    ```bash
    # Open docker-compose.yml and add your OpenAI API Key
    # - OPENAI_API_KEY=sk-...
    ```

3.  **Run the App**:
    ```bash
    docker-compose up --build
    ```

4.  **Access**:
    - Frontend: http://localhost:3000
    - Backend API Docs: http://localhost:8000/docs

## 📖 Documentation

- [Installation Guide](INSTALL.md)
- [RAG Setup & Usage](RAG_SETUP.md)
- [API Reference](API_GUIDE.md)
- [Deployment Guide](DEPLOYMENT.md)

## 🤝 Support

If you have any questions, reach out to support@antigravity.dev (Placeholder).

---
© 2026 Antigravity. All rights reserved.
