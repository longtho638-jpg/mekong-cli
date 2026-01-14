"""
🍬 EZ PR - Dễ Như Ăn Kẹo!

Super simple PR management for AgencyEr.
No technical knowledge needed!

Usage:
    # Tiếng Việt
    "check pr"
    "merge tất cả"
    "xem pr đang chờ"
    
    # English
    "check prs"
    "merge all"
    "show pending"
"""

from typing import Optional
from .pr_manager import PRManager, check_prs, merge_prs, auto_merge


class EzPR:
    """
    🍬 EZ PR - Designed for AgencyEr
    
    Super simple interface, no technical jargon.
    """
    
    # Natural language commands mapping
    COMMANDS = {
        # Vietnamese
        "check": "check",
        "xem": "check",
        "kiểm tra": "check",
        "pr": "check",
        "merge": "merge",
        "gộp": "merge",
        "hợp nhất": "merge",
        "tất cả": "all",
        "all": "all",
        "auto": "auto",
        "tự động": "auto",
        
        # English
        "show": "check",
        "list": "check",
        "view": "check",
        "pending": "check",
    }
    
    def __init__(self):
        self.manager = PRManager()
    
    def process(self, command: str) -> str:
        """
        Process natural language command.
        
        Examples:
            "check pr" → Shows PR status
            "merge all" → Merges eligible PRs
            "xem pr đang chờ" → Shows pending PRs
        """
        cmd_lower = command.lower().strip()
        
        # Detect intent
        if any(word in cmd_lower for word in ["check", "xem", "kiểm tra", "show", "list", "pending", "đang chờ"]):
            return self._check()
        
        elif any(word in cmd_lower for word in ["merge", "gộp", "hợp nhất"]):
            if any(word in cmd_lower for word in ["all", "tất cả", "hết", "auto", "tự động"]):
                return self._merge_all()
            else:
                return self._merge_dry()
        
        elif any(word in cmd_lower for word in ["help", "giúp", "hướng dẫn", "?"]):
            return self._help()
        
        else:
            return self._help()
    
    def _check(self) -> str:
        """Check all PRs - simple output."""
        prs = self.manager.get_open_prs()
        
        if not prs:
            return "📭 Không có PR nào đang chờ!\n\n🎉 Mọi thứ đã được merge."
        
        lines = [f"📋 CÓ {len(prs)} PR ĐANG CHỜ", ""]
        
        for pr in prs:
            can_merge, reason = self.manager.can_auto_merge(pr)
            status = "✅ Sẵn sàng merge" if can_merge else f"⏸️ {self._translate_reason(reason)}"
            
            lines.append(f"  #{pr.number} {pr.title[:40]}...")
            lines.append(f"      {status}")
            lines.append("")
        
        lines.append("💡 Gõ 'merge all' hoặc 'gộp tất cả' để merge.")
        
        return "\n".join(lines)
    
    def _merge_dry(self) -> str:
        """Dry run merge."""
        report = self.manager.check_and_merge_all(dry_run=True)
        
        if report["total"] == 0:
            return "📭 Không có PR nào để merge!"
        
        eligible = [pr for pr in self.manager.get_open_prs() 
                   if self.manager.can_auto_merge(pr)[0]]
        
        if not eligible:
            return "⏸️ Không có PR nào đủ điều kiện auto-merge.\n\n💡 PRs cần: CI pass + không conflict + từ Jules"
        
        lines = [f"🔍 SẴN SÀNG MERGE {len(eligible)} PR:", ""]
        for pr in eligible:
            lines.append(f"  ✅ #{pr.number} {pr.title[:40]}...")
        
        lines.append("")
        lines.append("💡 Gõ 'merge all' để thực sự merge!")
        
        return "\n".join(lines)
    
    def _merge_all(self) -> str:
        """Actually merge all eligible PRs."""
        report = self.manager.check_and_merge_all(dry_run=False)
        
        if report["total"] == 0:
            return "📭 Không có PR nào!"
        
        if report["merged"]:
            lines = ["🎉 ĐÃ MERGE THÀNH CÔNG!", ""]
            for pr_num in report["merged"]:
                lines.append(f"  ✅ PR #{pr_num}")
            return "\n".join(lines)
        
        elif report["skipped"]:
            return "⏸️ Không có PR nào đủ điều kiện merge.\n\n💡 Cần: CI pass + không conflict"
        
        else:
            return "❌ Có lỗi khi merge. Vui lòng check GitHub."
    
    def _translate_reason(self, reason: str) -> str:
        """Translate technical reason to simple Vietnamese."""
        translations = {
            "Author": "Không phải từ Jules",
            "not in trusted": "Cần review thủ công",
            "conflicts": "Có xung đột code",
            "not mergeable": "Không thể merge",
            "CI checks": "Đang chờ CI",
            "not passed": "CI chưa pass",
        }
        
        for eng, vn in translations.items():
            if eng.lower() in reason.lower():
                return vn
        
        return reason
    
    def _help(self) -> str:
        """Show help in Vietnamese."""
        return """
🍬 EZ PR - DỄ NHƯ ĂN KẸO!

📋 Các lệnh:
  • "check pr" hoặc "xem pr" → Xem PR đang chờ
  • "merge all" hoặc "gộp tất cả" → Merge tất cả
  • "help" hoặc "giúp" → Xem hướng dẫn này

💡 Ví dụ:
  Anh: check pr
  Bot: 📋 Có 2 PR đang chờ...
  
  Anh: merge all
  Bot: 🎉 Đã merge 2 PR!

🤖 PRs từ Jules sẽ tự động merge nếu:
  ✅ CI tests pass
  ✅ Không có conflict
"""


# Quick functions for natural language
def ez(command: str) -> str:
    """Process natural language PR command."""
    return EzPR().process(command)


def xem_pr() -> str:
    """Check PRs in Vietnamese."""
    return ez("xem pr")


def merge_tat_ca() -> str:
    """Merge all in Vietnamese."""
    return ez("merge tất cả")


# CLI
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = " ".join(sys.argv[1:])
        print(ez(command))
    else:
        print(ez("help"))
