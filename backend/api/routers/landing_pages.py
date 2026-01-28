from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.api.dependencies.database import get_db
from backend.models.landing_page import (
    ABTestCreate,
    ABTestResponse,
    AnalyticsEventCreate,
    LandingPageCreate,
    LandingPageResponse,
    LandingPageUpdate,
)
from backend.services.cache.decorators import cache
from backend.services.landing_page_service import ABTestingService, LandingPageService

router = APIRouter(
    prefix="/landing-pages",
    tags=["landing-pages"],
    responses={404: {"description": "Not found"}},
)

# --- Landing Pages CRUD ---

@router.get("/", response_model=List[LandingPageResponse])
@cache(
    ttl=60,
    prefix="landing_pages",
    key_func=lambda skip=0, limit=100, **kwargs: f"list:{skip}:{limit}",
    tags=["landing_pages"]
)
def get_landing_pages(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    service = LandingPageService(db)
    return service.get_landing_pages(skip=skip, limit=limit)

@router.post("/", response_model=LandingPageResponse, status_code=status.HTTP_201_CREATED)
def create_landing_page(
    page: LandingPageCreate,
    db: Session = Depends(get_db)
):
    service = LandingPageService(db)
    # Check if slug exists
    if service.get_landing_page_by_slug(page.slug):
        raise HTTPException(status_code=400, detail="Slug already registered")
    return service.create_landing_page(page)

@router.get("/{page_id}", response_model=LandingPageResponse)
@cache(
    ttl=60,
    prefix="landing_pages",
    key_func=lambda page_id, **kwargs: f"detail:{page_id}",
    tags=["landing_pages"]
)
def get_landing_page(
    page_id: int,
    db: Session = Depends(get_db)
):
    service = LandingPageService(db)
    db_page = service.get_landing_page(page_id)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Landing page not found")
    return db_page

@router.put("/{page_id}", response_model=LandingPageResponse)
def update_landing_page(
    page_id: int,
    page_update: LandingPageUpdate,
    db: Session = Depends(get_db)
):
    service = LandingPageService(db)
    db_page = service.update_landing_page(page_id, page_update)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Landing page not found")
    return db_page

@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_landing_page(
    page_id: int,
    db: Session = Depends(get_db)
):
    service = LandingPageService(db)
    success = service.delete_landing_page(page_id)
    if not success:
        raise HTTPException(status_code=404, detail="Landing page not found")
    return None

@router.post("/{page_id}/publish", response_model=LandingPageResponse)
def publish_landing_page(
    page_id: int,
    db: Session = Depends(get_db)
):
    service = LandingPageService(db)
    db_page = service.publish_landing_page(page_id)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Landing page not found")
    return db_page

@router.post("/{page_id}/unpublish", response_model=LandingPageResponse)
def unpublish_landing_page(
    page_id: int,
    db: Session = Depends(get_db)
):
    service = LandingPageService(db)
    db_page = service.unpublish_landing_page(page_id)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Landing page not found")
    return db_page

@router.post("/{page_id}/duplicate", response_model=LandingPageResponse)
def duplicate_landing_page(
    page_id: int,
    new_title: str,
    new_slug: str,
    db: Session = Depends(get_db)
):
    service = LandingPageService(db)
    if service.get_landing_page_by_slug(new_slug):
        raise HTTPException(status_code=400, detail="Target slug already exists")

    db_page = service.duplicate_landing_page(page_id, new_title, new_slug)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Source landing page not found")
    return db_page

# --- A/B Testing & Analytics ---

@router.post("/ab-tests", response_model=ABTestResponse, status_code=status.HTTP_201_CREATED)
def create_ab_test(
    test_data: ABTestCreate,
    db: Session = Depends(get_db)
):
    service = ABTestingService(db)
    # Ensure landing page exists
    lp_service = LandingPageService(db)
    if not lp_service.get_landing_page(test_data.landing_page_id):
        raise HTTPException(status_code=404, detail="Landing page not found")

    return service.create_ab_test(test_data)

@router.get("/ab-tests/results/{test_id}")
def get_ab_test_results(
    test_id: int,
    db: Session = Depends(get_db)
):
    service = ABTestingService(db)
    results = service.get_test_results(test_id)
    if not results:
        raise HTTPException(status_code=404, detail="Test not found")
    return results

@router.post("/analytics/events", status_code=status.HTTP_201_CREATED)
def record_analytics_event(
    event_data: AnalyticsEventCreate,
    db: Session = Depends(get_db)
):
    service = ABTestingService(db)
    try:
        service.record_event(event_data)
        return {"status": "recorded"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
