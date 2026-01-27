from typing import Optional

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/i18n", tags=["i18n"])

try:
    from backend.locales import i18n, t

    I18N_AVAILABLE = True
except ImportError:
    I18N_AVAILABLE = False


@router.get("/locales")
def get_locales():
    """Get available locales."""
    if not I18N_AVAILABLE:
        raise HTTPException(500, "i18n not available")

    return {"locales": i18n.get_available_locales(), "current": i18n.get_locale()}


@router.get("/translate/{key}")
def translate(key: str, locale: Optional[str] = None):
    """Translate a key."""
    if not I18N_AVAILABLE:
        raise HTTPException(500, "i18n not available")

    if locale:
        return {"key": key, "value": i18n.translate(key, locale=locale)}
    return {"key": key, "value": t(key)}


@router.post("/locale/{locale}")
def set_locale(locale: str):
    """Set current locale."""
    if not I18N_AVAILABLE:
        raise HTTPException(500, "i18n not available")

    i18n.set_locale(locale)
    return {"locale": i18n.get_locale()}
