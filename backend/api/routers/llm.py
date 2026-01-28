from typing import AsyncGenerator, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.api.auth.dependencies import get_current_active_superuser
from backend.services.llm.service import LLMService
from backend.services.llm.content import ContentService

router = APIRouter(prefix="/llm", tags=["AI/LLM"])

# --- Request Models ---

class GenerateRequest(BaseModel):
    prompt: str
    provider: Optional[str] = None
    model: Optional[str] = None
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7
    system_instruction: Optional[str] = None

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    provider: Optional[str] = None
    model: Optional[str] = None
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7

class BlogPostRequest(BaseModel):
    topic: str
    keywords: Optional[str] = None
    tone: Optional[str] = "professional"
    length: Optional[str] = "medium"

class SocialRequest(BaseModel):
    description: str
    platform: Optional[str] = "linkedin"

class SEORequest(BaseModel):
    content: str

# --- Endpoints ---

@router.post("/generate", dependencies=[Depends(get_current_active_superuser)])
async def generate_text(request: GenerateRequest):
    """
    Generate text using the configured LLM provider.
    """
    try:
        service = LLMService()
        result = await service.generate_text(
            prompt=request.prompt,
            provider=request.provider,
            model=request.model,
            max_tokens=request.max_tokens or 1000,
            temperature=request.temperature or 0.7,
            system_instruction=request.system_instruction
        )
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", dependencies=[Depends(get_current_active_superuser)])
async def chat(request: ChatRequest):
    """
    Chat completion endpoint.
    """
    try:
        service = LLMService()
        # Convert Pydantic models to dicts
        messages_dicts = [{"role": m.role, "content": m.content} for m in request.messages]

        result = await service.chat(
            messages=messages_dicts,
            provider=request.provider,
            model=request.model,
            max_tokens=request.max_tokens or 1000,
            temperature=request.temperature or 0.7
        )
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stream", dependencies=[Depends(get_current_active_superuser)])
async def stream_text(request: GenerateRequest):
    """
    Stream text generation.
    """
    service = LLMService()

    async def event_generator():
        try:
            async for chunk in service.generate_stream(
                prompt=request.prompt,
                provider=request.provider,
                model=request.model,
                max_tokens=request.max_tokens or 1000,
                temperature=request.temperature or 0.7,
                system_instruction=request.system_instruction
            ):
                yield chunk
        except Exception as e:
            yield str(e)

    return StreamingResponse(event_generator(), media_type="text/plain")

@router.post("/content/blog", dependencies=[Depends(get_current_active_superuser)])
async def generate_blog_post(request: BlogPostRequest):
    """
    Generate a blog post.
    """
    try:
        service = ContentService()
        result = await service.generate_blog_post(
            topic=request.topic,
            keywords=request.keywords,
            tone=request.tone or "professional",
            length=request.length or "medium"
        )
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/content/social", dependencies=[Depends(get_current_active_superuser)])
async def generate_social_caption(request: SocialRequest):
    """
    Generate a social media caption.
    """
    try:
        service = ContentService()
        result = await service.generate_social_media_caption(
            content_description=request.description,
            platform=request.platform or "linkedin"
        )
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/content/seo", dependencies=[Depends(get_current_active_superuser)])
async def optimize_seo(request: SEORequest):
    """
    Optimize content for SEO.
    """
    try:
        service = ContentService()
        result = await service.optimize_seo(content=request.content)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
