"""
📧 Template Service
===================
Handles Jinja2 template rendering for emails and other notifications.
Supports inheritance, caching, and custom filters.
"""

import logging
import os
from typing import Any, Dict, Optional

from jinja2 import Environment, FileSystemLoader, select_autoescape

from backend.api.config import settings

logger = logging.getLogger(__name__)


class TemplateService:
    def __init__(self, template_dir: Optional[str] = None):
        if not template_dir:
            # Default to backend/templates relative to this file's parent
            # backend/services/template_service.py -> backend/templates
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            template_dir = os.path.join(base_dir, "templates")

        self.template_dir = template_dir

        try:
            self.env = Environment(
                loader=FileSystemLoader(self.template_dir),
                autoescape=select_autoescape(["html", "xml"]),
                enable_async=True,  # Enable async rendering
            )
            logger.info(f"TemplateService initialized with dir: {self.template_dir}")
        except Exception as e:
            logger.error(f"Failed to initialize TemplateService: {e}")
            self.env = None

    async def render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """
        Render a Jinja2 template with the given context asynchronously.
        """
        if not self.env:
            raise RuntimeError("Template engine not initialized")

        try:
            template = self.env.get_template(template_name)

            # Add global context variables
            full_context = {
                "project_name": settings.project_name,
                "frontend_url": settings.frontend_url,
                "support_email": settings.default_from_email,
                **context,
            }

            return await template.render_async(full_context)
        except Exception as e:
            logger.error(f"Failed to render template {template_name}: {str(e)}")
            raise ValueError(f"Failed to render template {template_name}: {str(e)}")

    def render_template_sync(self, template_name: str, context: Dict[str, Any]) -> str:
        """
        Render a Jinja2 template synchronously (fallback).
        """
        if not self.env:
            raise RuntimeError("Template engine not initialized")

        try:
            template = self.env.get_template(template_name)

            # Add global context variables
            full_context = {
                "project_name": settings.project_name,
                "frontend_url": settings.frontend_url,
                "support_email": settings.default_from_email,
                **context,
            }

            return template.render(full_context)
        except Exception as e:
            logger.error(f"Failed to render template {template_name}: {str(e)}")
            raise ValueError(f"Failed to render template {template_name}: {str(e)}")


# Singleton instance
template_service = TemplateService()


def get_template_service():
    return template_service
