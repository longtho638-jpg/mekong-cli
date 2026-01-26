from datetime import datetime
from arq import create_pool
from arq.connections import ArqRedis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.unsubscribe_token import generate_unsubscribe_token
from app.models.campaign import Campaign, CampaignStatus
from app.models.subscriber import Subscriber
from app.services.template import template_service
from app.core.database import AsyncSessionLocal

class CampaignDispatcher:
    def __init__(self):
        self.settings = get_settings()
        self.redis: Optional[ArqRedis] = None

    async def connect(self):
        if not self.redis:
            self.redis = await create_pool(self.settings.REDIS_URL)

    async def dispatch_campaign(self, campaign_id: int):
        """
        Reads a campaign, fetches subscribers, and enqueues send jobs.
        """
        async with AsyncSessionLocal() as db:
            campaign = await db.get(Campaign, campaign_id)
            if not campaign:
                return

            # Update status
            campaign.status = CampaignStatus.SENDING
            campaign.started_at = datetime.utcnow()
            db.add(campaign)
            await db.commit()

            # Fetch subscribers (Logic: All active subscribers for now, or use list relationship)
            # In a real app, this needs pagination/chunking for large lists
            # For Kit MVP, we just fetch all
            stmt = select(Subscriber).where(Subscriber.status == "active")
            result = await db.execute(stmt)
            subscribers = result.scalars().all()

            await self.connect()

            for sub in subscribers:
                # Generate signed token for secure unsubscribe
                unsubscribe_token = generate_unsubscribe_token(sub.id)

                # Personalization context
                context = {
                    "first_name": sub.first_name,
                    "last_name": sub.last_name,
                    "email": sub.email,
                    # Secure unsubscribe link with HMAC-SHA256 signed token
                    "unsubscribe_link": f"{self.settings.API_V1_STR}/subscribers/unsubscribe?token={unsubscribe_token}",
                    "tracking_pixel": f"{self.settings.API_V1_STR}/t/o/{campaign.id}/{sub.id}/pixel.gif"
                }

                # Render
                try:
                    # Note: We use the campaign snapshot body
                    html_content = template_service.render(campaign.body_html, context)
                    # Inject pixel if not present (simple append)
                    if "</body>" in html_content:
                        html_content = html_content.replace("</body>", f'<img src="{context["tracking_pixel"]}" width="1" height="1" /></body>')
                    else:
                        html_content += f'<img src="{context["tracking_pixel"]}" width="1" height="1" />'

                    text_content = template_service.render(campaign.body_text or "", context)
                    subject = template_service.render(campaign.subject, context)

                    # Enqueue
                    email_data = {
                        "to_email": sub.email,
                        "subject": subject,
                        "html_content": html_content,
                        "text_content": text_content,
                    }

                    await self.redis.enqueue_job("send_email_task", email_data)

                    # Update stats (best effort)
                    campaign.sent_count += 1

                except Exception as e:
                    print(f"Error dispatching to {sub.email}: {e}")

            campaign.status = CampaignStatus.COMPLETED
            campaign.completed_at = datetime.utcnow()
            db.add(campaign)
            await db.commit()

dispatcher = CampaignDispatcher()
