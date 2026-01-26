from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.api import router
from app.database import Base, engine
from app.core.config import settings
import os

# Async Database Creation
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB Tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Close DB connection
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend service for collecting user feedback",
    version="1.0.0",
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded screenshots
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=settings.UPLOAD_DIR), name="static")

# Include Routes
app.include_router(router, prefix=settings.API_V1_STR, tags=["feedback"])

@app.get("/")
async def root():
    return {
        "message": "Feedback Widget API is running",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

