import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.template import EmailTemplate

INITIAL_TEMPLATES = [
    {
        "name": "Welcome Email",
        "subject": "Welcome to {{ company_name }}!",
        "body_html": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .btn { display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome, {{ first_name }}!</h1>
        <p>We are thrilled to have you on board.</p>
        <p>Here at {{ company_name }}, we strive to provide the best service possible.</p>
        <p><a href="{{ action_url }}" class="btn">Get Started</a></p>
        <hr>
        <p><small>If you didn't sign up, please ignore this email.</small></p>
        <p><small><a href="{{ unsubscribe_link }}">Unsubscribe</a></small></p>
    </div>
</body>
</html>
        """,
        "body_text": """
Welcome, {{ first_name }}!

We are thrilled to have you on board.
Here at {{ company_name }}, we strive to provide the best service possible.

Get Started: {{ action_url }}

If you didn't sign up, please ignore this email.
Unsubscribe: {{ unsubscribe_link }}
        """
    },
    {
        "name": "Password Reset",
        "subject": "Reset your password",
        "body_html": """
<!DOCTYPE html>
<html>
<body>
    <p>Hi {{ first_name }},</p>
    <p>We received a request to reset your password.</p>
    <p><a href="{{ reset_link }}">Click here to reset password</a></p>
    <p>If you didn't ask for this, you can ignore this email.</p>
</body>
</html>
        """,
        "body_text": """
Hi {{ first_name }},

We received a request to reset your password.
Reset link: {{ reset_link }}

If you didn't ask for this, you can ignore this email.
        """
    },
    {
        "name": "Drip 1: Introduction",
        "subject": "Getting the most out of our service",
        "body_html": """
<!DOCTYPE html>
<html>
<body>
    <h1>Tip #1: Setup your profile</h1>
    <p>Hi {{ first_name }},</p>
    <p>Did you know you can customize your dashboard?</p>
    <p>Log in now to check it out.</p>
    <p><a href="{{ unsubscribe_link }}">Unsubscribe</a></p>
</body>
</html>
        """,
        "body_text": "Hi {{ first_name }}, Did you know you can customize your dashboard? Log in now. Unsubscribe: {{ unsubscribe_link }}"
    }
]

async def seed_templates():
    async with AsyncSessionLocal() as db:
        print("Seeding templates...")
        for tpl in INITIAL_TEMPLATES:
            # Check if exists
            from sqlalchemy import select
            stmt = select(EmailTemplate).where(EmailTemplate.name == tpl["name"])
            result = await db.execute(stmt)
            if result.scalar_one_or_none():
                print(f"Skipping {tpl['name']} (exists)")
                continue

            db_obj = EmailTemplate(
                name=tpl["name"],
                subject=tpl["subject"],
                body_html=tpl["body_html"],
                body_text=tpl["body_text"]
            )
            db.add(db_obj)

        await db.commit()
        print("Templates seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed_templates())
