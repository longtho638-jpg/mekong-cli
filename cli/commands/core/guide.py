"""
Guide command for showing Vibe Coding Manual.
"""

from typing import List
from cli.commands.base import BaseCommand
from rich.markdown import Markdown


class GuideCommand(BaseCommand):
    """Guide command for Vibe Coding Manual."""
    
    @property
    def description(self) -> str:
        return "Show Vibe Coding Manual for beginners"
    
    def execute(self, args: List[str]) -> None:
        manual = """
# 🧘 VIBE CODING MANUAL (Quick Start)

**1. 🏗️  SCAFFOLD (Bản vẽ):**
   `$ agencyos scaffold "Tôi muốn làm app [ABC]"`
   -> Copy Prompt trả về -> Paste vào AI.

**2. 🤖 CODE (Thợ xây):**
   AI sẽ tự viết code theo cấu trúc chuẩn.

**3. 📋 KANBAN (Quản lý):**
   `$ agencyos kanban create "Review module X"`
   `$ agencyos kanban board`

**4. 🚀 SHIP (Vận hành):**
   `$ agencyos ship`

👉 Xem chi tiết: `docs/VIBE_CODING_MANUAL.md`
        """
        self.console.print(Markdown(manual))