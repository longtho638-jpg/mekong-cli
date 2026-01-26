from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from app.models.chat import ChatRequest, Message, Role, LLMProvider
from app.services.llm_provider import LLMService
from app.services.memory import MemoryService
from app.services.rag import RAGService
import json
import logging

router = APIRouter()
memory_service = MemoryService()
# Initialize RAG only if needed/env vars present to avoid startup crashes if optional
try:
    rag_service = RAGService()
except Exception as e:
    logging.warning(f"RAG Service not initialized (check API keys): {e}")
    rag_service = None

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream chat response from LLM.
    Supports history (if conversation_id provided) and RAG (implicit context injection).
    """

    # 1. Retrieve History if conversation_id exists
    history = []
    if request.conversation_id:
        history = await memory_service.get_history(request.conversation_id)

    # 2. Append User Message
    user_msg = request.messages[-1] # Assuming the last one is the new one
    # Note: request.messages might contain full history from frontend,
    # OR just new messages.
    # For this starter kit, let's assume request.messages is just the NEW message(s)
    # OR the frontend handles history.
    # To be robust, we'll use history from DB + request messages.

    # Actually, standard pattern: frontend sends full context or backend manages it.
    # Let's support backend-managed memory for "Production-Ready" feel.

    full_context = history + request.messages

    # 3. RAG Retrieval (Simple implementation: check if query needs context)
    # Ideally we'd have a flag or auto-detection. For now, assume RAG is enabled if configured.
    if rag_service and user_msg.role == Role.USER:
        context_docs = await rag_service.retrieve(user_msg.content)
        if context_docs:
            context_str = "\n\n".join(context_docs)
            system_rag_msg = Message(
                role=Role.SYSTEM,
                content=f"Context from knowledge base:\n{context_str}\n\nAnswer based on this context if relevant."
            )
            # Insert RAG context before user message
            full_context.insert(-1, system_rag_msg)

    # 4. Save User Message to Memory (Background task ideally, but sequential here for simplicity)
    if request.conversation_id:
        for msg in request.messages:
            await memory_service.add_message(request.conversation_id, msg)

    async def generate():
        llm_service = LLMService(
            provider=request.provider,
            model=request.model,
            temperature=request.temperature
        )

        full_response_content = ""

        try:
            async for token in llm_service.stream_response(full_context):
                full_response_content += token
                yield f"data: {token}\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"
            return

        # 5. Save Assistant Response to Memory
        if request.conversation_id:
            ai_msg = Message(role=Role.ASSISTANT, content=full_response_content)
            await memory_service.add_message(request.conversation_id, ai_msg)

        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
