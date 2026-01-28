from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from backend.api.auth.dependencies import get_current_user_id
from backend.db.session import get_db
from backend.models.user_preferences import (
    UserPreferences,
    UserPreferencesDB,
    UserPreferencesUpdate,
)

router = APIRouter(prefix="/api/user", tags=["user"])

@router.get("/preferences", response_model=UserPreferences)
def get_user_preferences(
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    prefs = db.query(UserPreferencesDB).filter(UserPreferencesDB.user_id == user_id).first()
    if not prefs:
        # Return defaults if no preferences found
        return UserPreferences(user_id=user_id)
    return prefs

@router.patch("/preferences", response_model=UserPreferences)
def update_user_preferences(
    prefs_in: UserPreferencesUpdate,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    prefs = db.query(UserPreferencesDB).filter(UserPreferencesDB.user_id == user_id).first()
    if not prefs:
        prefs = UserPreferencesDB(user_id=user_id)
        db.add(prefs)

    if prefs_in.preferred_language is not None:
        prefs.preferred_language = prefs_in.preferred_language
    if prefs_in.preferred_currency is not None:
        prefs.preferred_currency = prefs_in.preferred_currency
    if prefs_in.theme is not None:
        prefs.theme = prefs_in.theme

    db.commit()
    db.refresh(prefs)
    return prefs
