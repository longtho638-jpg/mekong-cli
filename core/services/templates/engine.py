"""
AI Wingman Template engine logic.
"""
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict

logger = logging.getLogger(__name__)

class TemplateProvider(ABC):
    @abstractmethod
    def get_template(self, name: str) -> str: pass
    @abstractmethod
    def list_templates(self) -> list[str]: pass

class DefaultTemplateProvider(TemplateProvider):
    def __init__(self):
        self.templates = {
            "inquiry_ack": "Hi {client_name}!\nThanks for reaching out to {agency_name}!",
            "proposal": "# Proposal for {client_name}\nProject: {project_name}",
        }

    def get_template(self, name: str) -> str:
        if name not in self.templates: raise ValueError(f"Template '{name}' not found")
        return self.templates[name]

    def list_templates(self) -> list[str]: return list(self.templates.keys())

class TemplateEngine:
    def __init__(self, provider: TemplateProvider):
        self.provider = provider

    def render(self, name: str, variables: Dict[str, Any]) -> str:
        template = self.provider.get_template(name)
        return template.format(**variables)
