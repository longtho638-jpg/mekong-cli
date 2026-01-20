"""
Proxy for entity imports to handle both package and direct execution for Portals.
"""
try:
    from ...services.client_portal_service import Client, ClientStatus, Invoice, Project
except ImportError:
    from services.client_portal_service import Client, ClientStatus, Invoice, Project
