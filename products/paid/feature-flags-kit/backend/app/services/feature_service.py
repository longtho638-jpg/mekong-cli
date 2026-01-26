import hashlib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.feature import FeatureFlag
from app.schemas.feature import FeatureFlagCreate, FeatureFlagUpdate, EvaluationContext

class FeatureService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_flag(self, flag_in: FeatureFlagCreate) -> FeatureFlag:
        db_flag = FeatureFlag(
            key=flag_in.key,
            description=flag_in.description,
            is_active=flag_in.is_active,
            targeting_rules=flag_in.targeting_rules
        )
        self.db.add(db_flag)
        await self.db.commit()
        await self.db.refresh(db_flag)
        return db_flag

    async def get_flag_by_key(self, key: str) -> FeatureFlag | None:
        result = await self.db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
        return result.scalars().first()

    async def get_all_flags(self) -> list[FeatureFlag]:
        result = await self.db.execute(select(FeatureFlag))
        return result.scalars().all()

    async def update_flag(self, key: str, flag_in: FeatureFlagUpdate) -> FeatureFlag | None:
        flag = await self.get_flag_by_key(key)
        if not flag:
            return None

        update_data = flag_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(flag, field, value)

        await self.db.commit()
        await self.db.refresh(flag)
        return flag

    async def delete_flag(self, key: str) -> bool:
        flag = await self.get_flag_by_key(key)
        if not flag:
            return False

        await self.db.delete(flag)
        await self.db.commit()
        return True

    def evaluate_flag(self, flag: FeatureFlag, context: EvaluationContext) -> bool:
        # 1. Global Kill Switch
        if not flag.is_active:
            return False

        # 2. Targeting Rules (Simple implementation)
        # Rule structure example:
        # {
        #   "type": "user_id",
        #   "operator": "in",
        #   "values": ["123", "456"],
        #   "enabled": true
        # }
        # {
        #   "type": "percentage",
        #   "value": 50, # 50%
        #   "enabled": true
        # }

        for rule in flag.targeting_rules:
            rule_type = rule.get("type")

            # User ID Targeting
            if rule_type == "user_id":
                if context.user_id and context.user_id in rule.get("values", []):
                    return rule.get("enabled", True)

            # Email Targeting
            if rule_type == "email":
                if context.email and context.email in rule.get("values", []):
                    return rule.get("enabled", True)

            # Percentage Rollout
            if rule_type == "percentage":
                percentage = rule.get("value", 0)
                if not context.user_id:
                    continue # Cannot rollout without ID

                # Deterministic Hashing: hash(flag_key + user_id) % 100
                hash_input = f"{flag.key}:{context.user_id}".encode("utf-8")
                hash_val = int(hashlib.sha256(hash_input).hexdigest(), 16)
                user_bucket = hash_val % 100

                if user_bucket < percentage:
                    return rule.get("enabled", True)

        # Default fallback (usually enabled if global is active, or disabled?)
        # For simple flags, if no rules match but it's active, it's ON.
        # But usually rules are restrictive or enabling.
        # Let's assume: if active, return True, unless specific rules say otherwise?
        # Actually standard is: Default False, unless rules match.
        # BUT for simple boolean flags without rules, we want them ON if is_active is True.

        if not flag.targeting_rules:
            return True

        return False # If rules exist but none match, default to False (safe)
