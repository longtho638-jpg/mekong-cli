"""
Webhook Transformer Service.
Handles payload transformation, filtering, and field mapping using Jinja2.
"""

import json
import logging
from typing import Any, Dict, Optional

from jinja2 import BaseLoader, Environment, TemplateSyntaxError

logger = logging.getLogger(__name__)


class WebhookTransformer:
    """
    Service for transforming webhook payloads.
    """

    def __init__(self):
        # Use BaseLoader to allow loading templates from strings
        self.jinja_env = Environment(loader=BaseLoader(), autoescape=True)
        # Register standard filters if needed
        self.jinja_env.filters["json"] = json.dumps

    def transform_payload(
        self, payload: Dict[str, Any], template_str: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Transform the payload using a Jinja2 template.
        If no template is provided, returns original payload.
        """
        if not template_str:
            return payload

        try:
            template = self.jinja_env.from_string(template_str)
            # Render the template with the payload as context
            rendered_str = template.render(event=payload)

            # Parse the rendered string back to JSON
            # This allows the template to construct a new JSON structure
            return json.loads(rendered_str)
        except json.JSONDecodeError as e:
            logger.error(f"Transformation resulted in invalid JSON: {e}")
            raise ValueError(f"Transformation resulted in invalid JSON: {e}")
        except TemplateSyntaxError as e:
            logger.error(f"Invalid Jinja2 template: {e}")
            raise ValueError(f"Invalid Jinja2 template: {e}")
        except Exception as e:
            logger.error(f"Transformation failed: {e}")
            raise ValueError(f"Transformation failed: {e}")

    def filter_fields(self, payload: Dict[str, Any], exclude_fields: list[str]) -> Dict[str, Any]:
        """
        Remove specified fields from the payload.
        Supports dot notation for nested fields (e.g. 'user.password').
        """
        if not exclude_fields:
            return payload

        # Deep copy to avoid modifying original
        import copy

        filtered_payload = copy.deepcopy(payload)

        for field in exclude_fields:
            self._delete_field(filtered_payload, field.split("."))

        return filtered_payload

    def _delete_field(self, obj: Dict[str, Any], path: list[str]):
        """
        Helper to delete nested fields.
        """
        if not path or not isinstance(obj, dict):
            return

        key = path[0]
        if len(path) == 1:
            if key in obj:
                del obj[key]
        else:
            if key in obj:
                self._delete_field(obj[key], path[1:])
