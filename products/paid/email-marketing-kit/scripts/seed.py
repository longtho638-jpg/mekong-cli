import asyncio
import sys
import os

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.subscriber import MailingList, Subscriber, SubscriberStatus
from app.models.template import EmailTemplate

async def seed_data():
    async with AsyncSessionLocal() as db:
        print("Seeding data...")

        # 1. Create a Default List
        default_list = MailingList(name="General Newsletter", description="The main newsletter list.")
        db.add(default_list)

        # 2. Create a Template
        mjml_content = """
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text font-size="20px" color="#F45E43" font-family="helvetica">Hello {{ first_name }}!</mj-text>
        <mj-text font-size="16px" color="#000000" font-family="helvetica">
          Welcome to our newsletter. We are excited to have you on board.
        </mj-text>
        <mj-button href="{{ unsubscribe_link }}">Unsubscribe</mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
"""
        template = EmailTemplate(
            name="Welcome Email",
            subject="Welcome to the club, {{ first_name }}!",
            body_mjml=mjml_content,
            # We explicitly set body_html here assuming the service isn't automatically called in this script
            # In a real app, we'd use the service to compile it.
            body_html="<h1>Hello {{ first_name }}!</h1><p>Welcome to our newsletter.</p><a href='{{ unsubscribe_link }}'>Unsubscribe</a>",
            body_text="Hello {{ first_name }}!\n\nWelcome to our newsletter.\n\nUnsubscribe: {{ unsubscribe_link }}"
        )
        db.add(template)

        # 3. Create a Subscriber
        subscriber = Subscriber(
            email="demo@example.com",
            first_name="Demo",
            last_name="User",
            status=SubscriberStatus.ACTIVE
        )
        subscriber.lists.append(default_list)
        db.add(subscriber)

        await db.commit()
        print("Data seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
