"""
Command Service - Business logic for Mekong commands
"""

import logging
from typing import Dict, List

from typing_extensions import TypedDict

from backend.models.command import CommandRequest, CommandResponse

logger = logging.getLogger(__name__)


class CommandInfo(TypedDict):
    """Metadata for a Mekong command"""

    section: str
    output_format: str


class CommandListResponse(TypedDict):
    """Response structure for listing commands"""

    commands: List[str]
    total: int
    categories: Dict[str, List[str]]


class CommandService:
    """Service for managing Mekong command operations"""

    def __init__(self):
        self.commands: Dict[str, CommandInfo] = {
            "khach-hang": {"section": "§1 Customer Profile", "output_format": "buyer_personas"},
            "ke-hoach-kinh-doanh": {
                "section": "§2 Business Plan",
                "output_format": "business_model_canvas",
            },
            "nghien-cuu-thi-truong": {
                "section": "§3 Market Research",
                "output_format": "tam_sam_som",
            },
            "nhan-dien-thuong-hieu": {
                "section": "§4 Brand Identity",
                "output_format": "brand_guidelines",
            },
            "thong-diep-tiep-thi": {"section": "§5 Marketing Message", "output_format": "usp_cta"},
            "ke-hoach-tiep-thi": {"section": "§6 Marketing Plan", "output_format": "plg_strategy"},
            "noi-dung-tiep-thi": {
                "section": "§7 Marketing Content",
                "output_format": "website_landing_copy",
            },
            "y-tuong-social-media": {
                "section": "§8 Social Media",
                "output_format": "50_ideas_5_pillars",
            },
            "chien-luoc-ban-hang": {
                "section": "§9 Sales Strategy",
                "output_format": "gtm_channels",
            },
            "ke-hoach-pr": {"section": "§10 PR Plan", "output_format": "strategic_partners"},
            "ke-hoach-tang-truong": {
                "section": "§11 Growth Plan",
                "output_format": "bullseye_viral",
            },
            "nong-san": {"section": "Local Market", "output_format": "price_analysis"},
            "ban-hang": {"section": "Sales Ops", "output_format": "funnel_optimization"},
            "tiep-thi": {"section": "Marketing Ops", "output_format": "campaign_automation"},
        }

    async def execute_command(self, command_name: str, request: CommandRequest) -> CommandResponse:
        """Execute a specific Mekong command"""
        logger.info(f"Executing Mekong command: {command_name}")

        if command_name not in self.commands:
            logger.error(f"Unknown command attempted: {command_name}")
            raise ValueError(f"Unknown command: {command_name}")

        command_info = self.commands[command_name]

        return CommandResponse(
            command=command_name,
            section=command_info["section"],
            status="processing",
            prompt=request.prompt,
            output_format=command_info["output_format"],
        )

    async def get_commands_list(self) -> CommandListResponse:
        """Get list of all available commands"""
        return {
            "commands": list(self.commands.keys()),
            "total": len(self.commands),
            "categories": {
                "business_planning": ["khach-hang", "ke-hoach-kinh-doanh", "nghien-cuu-thi-truong"],
                "branding": ["nhan-dien-thuong-hieu", "thong-diep-tiep-thi"],
                "marketing": ["ke-hoach-tiep-thi", "noi-dung-tiep-thi", "y-tuong-social-media"],
                "sales": ["chien-luoc-ban-hang", "ban-hang"],
                "operations": ["ke-hoach-pr", "ke-hoach-tang-truong", "tiep-thi"],
                "local": ["nong-san"],
            },
        }
