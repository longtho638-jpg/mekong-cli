from fastapi import APIRouter, HTTPException, Depends
from backend.core.security.audit import audit_action
from backend.core.security.rbac import require_viewer, require_developer

router = APIRouter(prefix="/api/crm", tags=["CRM"])

# Lazy loading - CRM only imported on first use
_crm_instance = None
_crm_loaded = False


def _get_crm():
    """Lazy load CRM instance on first API call."""
    global _crm_instance, _crm_loaded
    if not _crm_loaded:
        try:
            from core import CRM

            if CRM is not None:
                _crm_instance = CRM()
        except (ImportError, TypeError, Exception):
            _crm_instance = None
        _crm_loaded = True
    return _crm_instance


@router.get("/summary", dependencies=[Depends(require_viewer)])
@audit_action(action="view_crm_summary")
def get_crm_summary():
    """Get CRM summary."""
    crm = _get_crm()
    if crm is None:
        raise HTTPException(500, "CRM not available")
    return crm.get_summary()


@router.get("/deals", dependencies=[Depends(require_viewer)])
@audit_action(action="view_crm_deals")
def get_crm_deals():
    """Get all deals."""
    crm = _get_crm()
    if crm is None:
        raise HTTPException(500, "CRM not available")
    return [
        {
            "id": d.id,
            "title": d.title,
            "value": d.value,
            "stage": d.stage.value,
            "contact_id": d.contact_id,
        }
        for d in crm.deals.values()
    ]


@router.get("/contacts", dependencies=[Depends(require_viewer)])
@audit_action(action="view_crm_contacts")
def get_crm_contacts():
    """Get all contacts."""
    crm = _get_crm()
    if crm is None:
        raise HTTPException(500, "CRM not available")
    return [
        {
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "company": c.company,
            "lead_score": c.lead_score,
        }
        for c in crm.contacts.values()
    ]


@router.get("/hot-leads", dependencies=[Depends(require_developer)])
@audit_action(action="view_hot_leads")
def get_hot_leads():
    """Get hot leads."""
    crm = _get_crm()
    if crm is None:
        raise HTTPException(500, "CRM not available")
    hot = crm.get_hot_leads()
    return [
        {"id": c.id, "name": c.name, "company": c.company, "lead_score": c.lead_score} for c in hot
    ]
