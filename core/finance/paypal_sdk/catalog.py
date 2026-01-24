from typing import Dict, List, Optional

from .base import PayPalBase


class Catalog(PayPalBase):
    """
    PayPal Catalog API (Products & Plans)
    Ref: https://developer.paypal.com/docs/api/catalog-products/v1/
         https://developer.paypal.com/docs/api/subscriptions/v1/
    """

    # --- Products ---

    def create_product(
        self,
        name: str,
        description: str,
        type: str = "SERVICE",
        category: str = "SOFTWARE",
        image_url: str = None,
        home_url: str = None,
    ) -> Optional[Dict]:
        """
        Create a product.
        """
        payload = {
            "name": name,
            "description": description,
            "type": type,
            "category": category,
        }
        if image_url:
            payload["image_url"] = image_url
        if home_url:
            payload["home_url"] = home_url

        return self._api("POST", "/v1/catalogs/products", payload)

    def list_products(self, page: int = 1, page_size: int = 10) -> Optional[Dict]:
        """
        List products.
        """
        return self._api("GET", f"/v1/catalogs/products?page={page}&page_size={page_size}")

    def get_product(self, product_id: str) -> Optional[Dict]:
        """
        Get product details.
        """
        return self._api("GET", f"/v1/catalogs/products/{product_id}")

    # --- Plans ---

    def create_plan(
        self,
        product_id: str,
        name: str,
        description: str,
        billing_cycles: List[Dict],
        payment_preferences: Dict = None,
        status: str = "ACTIVE",
    ) -> Optional[Dict]:
        """
        Create a subscription plan.

        billing_cycles example:
        [
            {
                "frequency": {"interval_unit": "MONTH", "interval_count": 1},
                "tenure_type": "REGULAR",
                "sequence": 1,
                "total_cycles": 0, # 0 = infinite
                "pricing_scheme": {
                    "fixed_price": {"value": "10", "currency_code": "USD"}
                }
            }
        ]
        """
        payload = {
            "product_id": product_id,
            "name": name,
            "description": description,
            "status": status,
            "billing_cycles": billing_cycles,
            "payment_preferences": payment_preferences or {
                "auto_bill_outstanding": True,
                "setup_fee": {"value": "0", "currency_code": "USD"},
                "setup_fee_failure_action": "CONTINUE",
                "payment_failure_threshold": 3
            },
        }
        return self._api("POST", "/v1/billing/plans", payload)

    def list_plans(
        self, product_id: str = None, page: int = 1, page_size: int = 10
    ) -> Optional[Dict]:
        """
        List plans.
        """
        endpoint = f"/v1/billing/plans?page={page}&page_size={page_size}"
        if product_id:
            endpoint += f"&product_id={product_id}"
        return self._api("GET", endpoint)

    def get_plan(self, plan_id: str) -> Optional[Dict]:
        """
        Get plan details.
        """
        return self._api("GET", f"/v1/billing/plans/{plan_id}")

    def update_plan_pricing(self, plan_id: str, pricing_schemes: List[Dict]) -> Optional[Dict]:
        """
        Update pricing for a plan.
        Note: This is complex in PayPal API, usually requires creating a new plan or updating specific pricing schemes.
        This is a placeholder for `POST /v1/billing/plans/{id}/update-pricing-schemes`
        """
        payload = {"pricing_schemes": pricing_schemes}
        return self._api("POST", f"/v1/billing/plans/{plan_id}/update-pricing-schemes", payload)
