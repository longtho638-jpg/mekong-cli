from typing import Dict, Optional, Any
import requests
import os
import base64
from datetime import datetime, timedelta

class PayPalBase:
    """Base class for PayPal API modules."""

    def __init__(self, sdk):
        self.sdk = sdk

    def _api(self, method: str, endpoint: str, data: Dict = None) -> Optional[Dict]:
        return self.sdk._api(method, endpoint, data)
