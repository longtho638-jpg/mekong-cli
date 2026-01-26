from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User
from app.providers.base import UnifiedUserProfile

class UserService:
    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).filter(User.email == email))
        return result.scalars().first()

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        result = await db.execute(select(User).filter(User.id == user_id))
        return result.scalars().first()

    @staticmethod
    async def get_or_create_social_user(db: AsyncSession, profile: UnifiedUserProfile) -> User:
        user = await UserService.get_by_email(db, profile.email)

        if not user:
            user = User(
                email=profile.email,
                full_name=profile.full_name,
                avatar_url=profile.avatar_url,
                is_active=True
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            # Update profile info if changed
            if user.full_name != profile.full_name or user.avatar_url != profile.avatar_url:
                user.full_name = profile.full_name
                user.avatar_url = profile.avatar_url
                db.add(user)
                await db.commit()
                await db.refresh(user)

        return user
