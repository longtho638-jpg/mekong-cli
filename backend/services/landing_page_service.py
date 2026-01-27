import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.models.enums import AnalyticsEventType
from backend.models.landing_page import (
    ABTest,
    ABTestCreate,
    ABTestStatus,
    AnalyticsEvent,
    AnalyticsEventCreate,
    LandingPage,
    LandingPageCreate,
    LandingPageUpdate,
)


class LandingPageService:
    def __init__(self, db: Session):
        self.db = db

    def get_landing_pages(self, skip: int = 0, limit: int = 100) -> List[LandingPage]:
        return self.db.query(LandingPage).offset(skip).limit(limit).all()

    def get_landing_page(self, page_id: int) -> Optional[LandingPage]:
        return self.db.query(LandingPage).filter(LandingPage.id == page_id).first()

    def get_landing_page_by_uuid(self, page_uuid: str) -> Optional[LandingPage]:
        return self.db.query(LandingPage).filter(LandingPage.uuid == page_uuid).first()

    def get_landing_page_by_slug(self, slug: str) -> Optional[LandingPage]:
        return self.db.query(LandingPage).filter(LandingPage.slug == slug).first()

    def create_landing_page(self, page: LandingPageCreate) -> LandingPage:
        db_page = LandingPage(
            uuid=str(uuid.uuid4()),
            title=page.title,
            slug=page.slug,
            content_json=page.content_json,
            seo_metadata=page.seo_metadata,
            template_id=page.template_id,
            is_published=page.is_published
        )
        self.db.add(db_page)
        self.db.commit()
        self.db.refresh(db_page)
        return db_page

    def update_landing_page(self, page_id: int, page_update: LandingPageUpdate) -> Optional[LandingPage]:
        db_page = self.get_landing_page(page_id)
        if not db_page:
            return None

        update_data = page_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_page, key, value)

        self.db.commit()
        self.db.refresh(db_page)
        return db_page

    def delete_landing_page(self, page_id: int) -> bool:
        db_page = self.get_landing_page(page_id)
        if not db_page:
            return False
        self.db.delete(db_page)
        self.db.commit()
        return True

    def publish_landing_page(self, page_id: int) -> Optional[LandingPage]:
        return self.update_landing_page(page_id, LandingPageUpdate(is_published=True))

    def unpublish_landing_page(self, page_id: int) -> Optional[LandingPage]:
        return self.update_landing_page(page_id, LandingPageUpdate(is_published=False))

    def duplicate_landing_page(self, page_id: int, new_title: str, new_slug: str) -> Optional[LandingPage]:
        original_page = self.get_landing_page(page_id)
        if not original_page:
            return None

        new_page = LandingPage(
            uuid=str(uuid.uuid4()),
            title=new_title,
            slug=new_slug,
            content_json=original_page.content_json,
            seo_metadata=original_page.seo_metadata,
            template_id=original_page.template_id,
            is_published=False
        )
        self.db.add(new_page)
        self.db.commit()
        self.db.refresh(new_page)
        return new_page

class ABTestingService:
    def __init__(self, db: Session):
        self.db = db

    def create_ab_test(self, test_data: ABTestCreate) -> ABTest:
        # Check if there is already a running test for this page
        existing_test = self.db.query(ABTest).filter(
            ABTest.landing_page_id == test_data.landing_page_id,
            ABTest.status == ABTestStatus.RUNNING
        ).first()

        if existing_test:
            # Optionally handle this case (error or pause existing)
            pass

        db_test = ABTest(
            landing_page_id=test_data.landing_page_id,
            variants_json=test_data.variants_json,
            traffic_split=test_data.traffic_split,
            status=test_data.status
        )
        self.db.add(db_test)
        self.db.commit()
        self.db.refresh(db_test)
        return db_test

    def get_active_test_for_page(self, landing_page_id: int) -> Optional[ABTest]:
        return self.db.query(ABTest).filter(
            ABTest.landing_page_id == landing_page_id,
            ABTest.status == ABTestStatus.RUNNING
        ).first()

    def record_event(self, event_data: AnalyticsEventCreate) -> AnalyticsEvent:
        # Resolve landing page ID from UUID
        page = self.db.query(LandingPage).filter(LandingPage.uuid == event_data.landing_page_uuid).first()
        if not page:
             # If page not found, we can't link it properly. Return None or raise.
             # For now, let's assume valid UUID is passed or fail gracefully
             raise ValueError("Invalid Landing Page UUID")

        db_event = AnalyticsEvent(
            landing_page_id=page.id,
            variant_id=event_data.variant_id,
            event_type=event_data.event_type,
            user_id=event_data.user_id,
            session_id=event_data.session_id,
            metadata_=event_data.metadata
        )
        self.db.add(db_event)
        self.db.commit()
        self.db.refresh(db_event)
        return db_event

    def get_test_results(self, test_id: int) -> Dict[str, Any]:
        test = self.db.query(ABTest).filter(ABTest.id == test_id).first()
        if not test:
            return {}

        # Simple aggregation
        # In a real system, this would be more complex or offloaded to an analytics DB

        results = {}
        # Iterate over variants in the test config
        for variant in test.variants_json:
            variant_id = variant.get("id")
            if not variant_id:
                continue

            # Count page views
            views = self.db.query(func.count(AnalyticsEvent.id)).filter(
                AnalyticsEvent.landing_page_id == test.landing_page_id,
                AnalyticsEvent.variant_id == variant_id,
                AnalyticsEvent.event_type == AnalyticsEventType.PAGE_VIEW,
                AnalyticsEvent.timestamp >= test.created_at # rudimentary time filter
            ).scalar()

            # Count conversions (e.g., form submission)
            conversions = self.db.query(func.count(AnalyticsEvent.id)).filter(
                AnalyticsEvent.landing_page_id == test.landing_page_id,
                AnalyticsEvent.variant_id == variant_id,
                AnalyticsEvent.event_type == AnalyticsEventType.FORM_SUBMISSION,
                AnalyticsEvent.timestamp >= test.created_at
            ).scalar()

            rate = (conversions / views) if views > 0 else 0

            results[variant_id] = {
                "views": views,
                "conversions": conversions,
                "conversion_rate": rate
            }

        return {
            "test_id": test_id,
            "status": test.status,
            "results": results
        }
