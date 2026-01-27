from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas
from .database import get_db

router = APIRouter()

@router.get("/preferences/{user_id}", response_model=schemas.UserPreferences)
def read_user_preferences(user_id: str, db: Session = Depends(get_db)):
    db_prefs = db.query(models.UserPreferences).filter(models.UserPreferences.user_id == user_id).first()
    if db_prefs is None:
        # Create default preferences if not found
        db_prefs = models.UserPreferences(user_id=user_id)
        db.add(db_prefs)
        db.commit()
        db.refresh(db_prefs)
    return db_prefs

@router.put("/preferences/{user_id}", response_model=schemas.UserPreferences)
def update_user_preferences(user_id: str, prefs: schemas.UserPreferencesUpdate, db: Session = Depends(get_db)):
    db_prefs = db.query(models.UserPreferences).filter(models.UserPreferences.user_id == user_id).first()
    if db_prefs is None:
        # Create if not exists
        db_prefs = models.UserPreferences(user_id=user_id)
        db.add(db_prefs)

    update_data = prefs.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_prefs, key, value)

    db.commit()
    db.refresh(db_prefs)
    return db_prefs
