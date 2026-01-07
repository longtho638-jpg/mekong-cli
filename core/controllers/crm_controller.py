"""
Controller: CRM
Handles HTTP requests for CRM operations.

Clean Architecture Layer: Controllers
"""

from typing import Dict, Any, List
from core.use_cases.create_deal import CreateDealUseCase
from core.entities.deal import Deal


class CRMController:
    """Controller for CRM operations."""
    
    def __init__(self):
        self.create_deal_use_case = CreateDealUseCase()
    
    def create_deal(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle create deal request.
        
        Args:
            request_data: Dict with title, company, value, probability
        
        Returns:
            Response dict with created deal data
        """
        try:
            # Extract request data
            title = request_data.get("title", "")
            company = request_data.get("company", "")
            value = request_data.get("value", 0.0)
            probability = request_data.get("probability", 50.0)
            contact_id = request_data.get("contact_id")
            
            # Execute use case
            deal = self.create_deal_use_case.execute(
                title=title,
                company=company,
                value=value,
                probability=probability,
                contact_id=contact_id
            )
            
            # Format response
            return {
                "success": True,
                "data": {
                    "id": deal.id,
                    "title": deal.title,
                    "company": deal.company,
                    "value": deal.value,
                    "stage": deal.stage.value,
                    "probability": deal.probability,
                    "weighted_value": deal.calculate_weighted_value()
                }
            }
        
        except ValueError as e:
            return {
                "success": False,
                "error": str(e)
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Internal error: {str(e)}"
            }
