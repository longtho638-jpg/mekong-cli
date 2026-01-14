from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/crm", tags=["CRM"])

# Safe import with None check
CRM_AVAILABLE = False
crm = None

try:
    from core import CRM
    if CRM is not None:
        crm = CRM()
        CRM_AVAILABLE = True
except (ImportError, TypeError, Exception):
    CRM_AVAILABLE = False
    crm = None

@router.get("/summary")
def get_crm_summary():
    """Get CRM summary."""
    if not CRM_AVAILABLE:
        raise HTTPException(500, "CRM not available")
    
    return crm.get_summary()

@router.get("/deals")
def get_crm_deals():
    """Get all deals."""
    if not CRM_AVAILABLE:
        raise HTTPException(500, "CRM not available")
    
    return [
        {
            "id": d.id,
            "title": d.title,
            "value": d.value,
            "stage": d.stage.value,
            "contact_id": d.contact_id
        }
        for d in crm.deals.values()
    ]

@router.get("/contacts")
def get_crm_contacts():
    """Get all contacts."""
    if not CRM_AVAILABLE:
        raise HTTPException(500, "CRM not available")
    
    return [
        {
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "company": c.company,
            "lead_score": c.lead_score
        }
        for c in crm.contacts.values()
    ]

@router.get("/hot-leads")
def get_hot_leads():
    """Get hot leads."""
    if not CRM_AVAILABLE:
        raise HTTPException(500, "CRM not available")
    
    hot = crm.get_hot_leads()
    return [
        {
            "id": c.id,
            "name": c.name,
            "company": c.company,
            "lead_score": c.lead_score
        }
        for c in hot
    ]
