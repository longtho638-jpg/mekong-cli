"""
Career pathways and Training management logic.
"""
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from .models import CareerLevel, CareerPath, Training, TrainingType

logger = logging.getLogger(__name__)

class PathwayManager:
    def __init__(self):
        self.career_paths: Dict[str, CareerPath] = {}
        self.trainings: Dict[str, Training] = {}

    def create_career_path(
        self,
        employee: str,
        current_role: str,
        current_level: CareerLevel,
        target_role: str,
        target_level: CareerLevel,
        months: int = 12,
    ) -> CareerPath:
        """Define a new growth path for an employee."""
        if not employee:
            raise ValueError("Employee name required")

        path = CareerPath(
            id=f"CAR-{uuid.uuid4().hex[:6].upper()}",
            employee=employee,
            current_role=current_role,
            current_level=current_level,
            target_role=target_role,
            target_level=target_level,
            target_date=datetime.now() + timedelta(days=months * 30),
        )
        self.career_paths[path.id] = path
        logger.info(f"Career path created for {employee}: {current_role} -> {target_role}")
        return path

    def add_training(
        self,
        name: str,
        training_type: TrainingType,
        hours: int,
        cost: float = 0.0,
        skills: Optional[List[str]] = None,
    ) -> Training:
        """Register a new training program."""
        training = Training(
            id=f"TRN-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            training_type=training_type,
            duration_hours=hours,
            cost=cost,
            skills=skills or [],
        )
        self.trainings[training.id] = training
        logger.info(f"Training registered: {name} ({training_type.value})")
        return training

    def complete_training(self, training_id: str, employee: str) -> bool:
        """Log training completion for an employee."""
        if training_id not in self.trainings:
            return False

        t = self.trainings[training_id]
        if employee not in t.completed_by:
            t.completed_by.append(employee)
            logger.info(f"{employee} completed {t.name}")
            return True
        return False
