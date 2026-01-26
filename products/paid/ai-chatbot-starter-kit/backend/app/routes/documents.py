from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks
from app.models.document import DocumentUploadResponse, SearchRequest, Document
from app.services.rag import RAGService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Try to init RAG, handle failure gracefully
try:
    rag_service = RAGService()
except Exception as e:
    logger.error(f"Failed to init RAG service: {e}")
    rag_service = None

@router.post("/upload/text", response_model=DocumentUploadResponse)
async def upload_text(document: Document):
    """Upload raw text for indexing"""
    if not rag_service:
        raise HTTPException(status_code=503, detail="RAG service unavailable")

    try:
        ids = await rag_service.ingest_text(document.content, document.metadata.model_dump())
        return DocumentUploadResponse(ids=ids, message="Text ingested successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload/file")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file (TXT/MD) for indexing"""
    if not rag_service:
        raise HTTPException(status_code=503, detail="RAG service unavailable")

    if not file.filename.endswith(('.txt', '.md')):
        raise HTTPException(status_code=400, detail="Only .txt and .md files supported currently")

    try:
        content = (await file.read()).decode("utf-8")
        ids = await rag_service.ingest_text(
            content,
            {"source": file.filename, "type": "file"}
        )
        return {"ids": ids, "message": f"File {file.filename} ingested successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search")
async def search_documents(request: SearchRequest):
    """Search the vector database"""
    if not rag_service:
        raise HTTPException(status_code=503, detail="RAG service unavailable")

    results = await rag_service.retrieve_with_metadata(request.query, request.k)
    return {"results": results}
