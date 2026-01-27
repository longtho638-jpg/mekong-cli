from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.drip import DripCampaign, DripStep, DripEnrollment, EnrollmentStatus, DripActionType
from app.models.subscriber import Subscriber
from app.services.template import template_service
from app.core.config import get_settings
from app.core.unsubscribe_token import generate_unsubscribe_token

# Circular dependency risk if we import worker directly, so we might need a way to enqueue jobs
# For now, we assume we can pass the redis pool or use a global one
from arq import create_pool
from arq.connections import ArqRedis

class DripService:
    def __init__(self):
        self.settings = get_settings()
        self.redis: Optional[ArqRedis] = None

    async def connect_redis(self):
        if not self.redis:
            self.redis = await create_pool(self.settings.REDIS_URL)

    async def enroll_subscriber(self, db: AsyncSession, drip_id: int, subscriber_id: int):
        """
        Enrolls a subscriber into a drip campaign starting at the first step.
        """
        # Check if already enrolled
        stmt = select(DripEnrollment).where(
            DripEnrollment.drip_campaign_id == drip_id,
            DripEnrollment.subscriber_id == subscriber_id,
            DripEnrollment.status == EnrollmentStatus.ACTIVE
        )
        existing = await db.execute(stmt)
        if existing.scalar_one_or_none():
            return # Already active

        # Get first step
        stmt = select(DripStep).where(
            DripStep.drip_campaign_id == drip_id
        ).order_by(DripStep.step_order.asc()).limit(1)
        result = await db.execute(stmt)
        first_step = result.scalar_one_or_none()

        if not first_step:
            return # No steps

        enrollment = DripEnrollment(
            drip_campaign_id=drip_id,
            subscriber_id=subscriber_id,
            current_step_id=first_step.id,
            next_run_at=datetime.utcnow(), # Run immediately
            status=EnrollmentStatus.ACTIVE
        )
        db.add(enrollment)
        await db.commit()
        await db.refresh(enrollment)
        return enrollment

    async def process_drips(self, db: AsyncSession):
        """
        Main loop to process all active enrollments due for execution.
        """
        await self.connect_redis()

        # Find active enrollments where next_run_at <= now
        now = datetime.utcnow()
        stmt = select(DripEnrollment).where(
            DripEnrollment.status == EnrollmentStatus.ACTIVE,
            DripEnrollment.next_run_at <= now
        )
        result = await db.execute(stmt)
        enrollments = result.scalars().all()

        for enrollment in enrollments:
            await self._process_enrollment(db, enrollment)

    async def _process_enrollment(self, db: AsyncSession, enrollment: DripEnrollment):
        """
        Process a single enrollment's current step and advance it.
        """
        # Load relationships explicitly if needed, but they are lazy loaded in sync usually.
        # In async, we should ensure we have them.
        from sqlalchemy.orm import selectinload

        # Load step with template if needed
        stmt = select(DripStep).options(selectinload(DripStep.template)).where(DripStep.id == enrollment.current_step_id)
        result = await db.execute(stmt)
        step = result.scalar_one_or_none()

        if not step:
            # Step deleted or something wrong, mark failed
            enrollment.status = EnrollmentStatus.FAILED
            await db.commit()
            return

        subscriber = await db.get(Subscriber, enrollment.subscriber_id)
        if not subscriber or subscriber.status != "active":
            enrollment.status = EnrollmentStatus.CANCELLED
            await db.commit()
            return

        # Execute Action
        if step.action_type == DripActionType.EMAIL:
            await self._send_drip_email(step, subscriber)

            # Move to next immediately (unless logic dictates otherwise, e.g. waiting for send?)
            # For simplicity, if it's an email step, we send it and move to next step immediately
            # If the NEXT step is a delay, it will set the next_run_at accordingly.
            await self._advance_step(db, enrollment, step)

        elif step.action_type == DripActionType.DELAY:
            # If we are here, it means the delay time has passed (since next_run_at <= now)
            # So we just move to the next step
            await self._advance_step(db, enrollment, step)

    async def _send_drip_email(self, step: DripStep, subscriber: Subscriber):
        if not step.template:
            return

        unsubscribe_token = generate_unsubscribe_token(subscriber.id)
        context = {
            "first_name": subscriber.first_name,
            "last_name": subscriber.last_name,
            "email": subscriber.email,
            "unsubscribe_link": f"{self.settings.API_V1_STR}/subscribers/unsubscribe?token={unsubscribe_token}",
        }

        # Render content
        html_content = template_service.render(step.template.body_html, context)
        text_content = template_service.render(step.template.body_text or "", context)
        subject = template_service.render(step.subject or step.template.subject, context)

        email_data = {
            "to_email": subscriber.email,
            "subject": subject,
            "html_content": html_content,
            "text_content": text_content,
        }

        await self.redis.enqueue_job("send_email_task", email_data)

    async def _advance_step(self, db: AsyncSession, enrollment: DripEnrollment, current_step: DripStep):
        # Find next step
        stmt = select(DripStep).where(
            DripStep.drip_campaign_id == current_step.drip_campaign_id,
            DripStep.step_order > current_step.step_order
        ).order_by(DripStep.step_order.asc()).limit(1)

        result = await db.execute(stmt)
        next_step = result.scalar_one_or_none()

        if next_step:
            enrollment.current_step_id = next_step.id

            # Calculate next run time
            if next_step.action_type == DripActionType.DELAY:
                # If next step is delay, we set next_run_at = now + delay
                # And when that time comes, we process it (which basically means "delay over")
                delay = next_step.delay_seconds or 0
                enrollment.next_run_at = datetime.utcnow() + timedelta(seconds=delay)
            else:
                # If next is Email, run immediately
                enrollment.next_run_at = datetime.utcnow()
        else:
            # No more steps
            enrollment.status = EnrollmentStatus.COMPLETED
            enrollment.completed_at = datetime.utcnow()
            enrollment.current_step_id = None

        db.add(enrollment)
        await db.commit()

drip_service = DripService()
