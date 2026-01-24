"\n"

import logging

from .pr_manager import PRManager

# Configure logging
logger = logging.getLogger(__name__)


class EzPR:
    """
    🍬 EZ PR - The Simplified Git Operator

    Acts as a bridge between the complex Git/GitHub workflow and the user.
    Uses basic intent detection to map natural language to PR actions.
    """

    # Intent Detection Patterns
    PATTERNS = {
        "check": ["check", "xem", "kiểm tra", "show", "list", "pending", "đang chờ", "trạng thái"],
        "merge_all": ["merge all", "gộp tất cả", "hợp nhất hết", "tự động gộp", "auto", "tự động"],
        "merge_dry": ["merge", "gộp", "hợp nhất", "thử gộp"],
        "help": ["help", "giúp", "hướng dẫn", "?", "làm sao"],
    }

    def __init__(self):
        self.manager = PRManager()

    def process(self, command: str) -> str:
        """
        Analyzes the user's natural language command and routes to the right action.
        """
        cmd = command.lower().strip()

        if any(p in cmd for p in self.PATTERNS["help"]):
            return self._help()

        if any(p in cmd for p in self.PATTERNS["merge_all"]):
            return self._merge_all()

        if any(p in cmd for p in self.PATTERNS["check"]):
            return self._check()

        if any(p in cmd for p in self.PATTERNS["merge_dry"]):
            return self._merge_dry()

        # Fallback to help
        return self._help()

    def _check(self) -> str:
        """Visual summary of open PRs."""
        prs = self.manager.get_open_prs()

        if not prs:
            return "📭 Tuyệt vời! Không có PR nào đang chờ.\n🎉 Tất cả thay đổi đã được áp dụng."

        lines = [f"📋 Đang có {len(prs)} thay đổi (PR) đang chờ duyệt:", ""]

        for pr in prs:
            can_merge, reason = self.manager.can_auto_merge(pr)
            icon = "✅ Sẵn sàng" if can_merge else f"⏸️ {self._translate_reason(reason)}"
            lines.append(f"  #{pr.number:<4} | {pr.title[:50]}")
            lines.append(f"        └─ Trạng thái: {icon}")
            lines.append("")

        lines.append("💡 Gõ 'merge all' để tự động áp dụng các thay đổi đã sẵn sàng.")
        return "\n".join(lines)

    def _merge_dry(self) -> str:
        """Validation run before actual merge."""
        report = self.manager.check_and_merge_all(dry_run=True)
        eligible = report.get("eligible", [])

        if not eligible:
            return "⏸️ Hiện chưa có thay đổi nào đủ điều kiện để gộp tự động.\n💡 Yêu cầu: Đã vượt qua kiểm tra (CI) và không có xung đột code."

        lines = [f"🔍 Đã tìm thấy {len(eligible)} thay đổi có thể gộp ngay:", ""]
        for pr_id in eligible:
            lines.append(f"  ✅ PR #{pr_id}")

        lines.append("\n🚀 Gõ 'merge all' để bắt đầu gộp!")
        return "\n".join(lines)

    def _merge_all(self) -> str:
        """Execution of automated merge for all eligible PRs."""
        logger.info("🍭 Bắt đầu gộp các thay đổi... Vui lòng đợi trong giây lát.")
        report = self.manager.check_and_merge_all(dry_run=False)

        merged = report.get("merged", [])
        if merged:
            lines = ["🎉 THÀNH CÔNG! Đã gộp các thay đổi sau:", ""]
            for pr_id in merged:
                lines.append(f"  ✅ PR #{pr_id} đã được đưa vào code chính.")
            return "\n".join(lines)

        return "⏸️ Không có thay đổi nào đủ điều kiện để gộp lúc này."

    def _translate_reason(self, reason: str) -> str:
        """Human-friendly translation of technical git errors."""
        mapping = {
            "Author": "Cần review thủ công (không phải từ bot)",
            "conflicts": "Có xung đột code (cần dev xử lý)",
            "CI checks": "Đang đợi hệ thống kiểm tra (CI)",
            "not passed": "Hệ thống kiểm tra báo lỗi (CI fail)",
            "draft": "Vẫn đang là bản nháp",
        }

        for eng, vn in mapping.items():
            if eng.lower() in reason.lower():
                return vn
        return f"Chờ xử lý ({reason})"

    def _help(self) -> str:
        """User-friendly guide."""
        return """
🍬 EZ PR - QUẢN LÝ THAY ĐỔI DỄ DÀNG

Chào Anh! Đây là cách Anh có thể duyệt các thay đổi từ AI:

📋 Các câu lệnh Anh có thể dùng:
  • \"xem pr\" / \"check\"      -> Xem danh sách thay đổi đang chờ.
  • \"merge all\" / \"gộp hết\" -> Tự động gộp các phần đã OK.
  • \"help\" / \"giúp\"         -> Xem lại hướng dẫn này.

🤖 Bot Jules sẽ tự động gộp nếu:
  ✅ Đã vượt qua các bài kiểm tra tự động (CI).
  ✅ Không bị trùng lặp hay xung đột với code hiện tại.
"""


# Interface Helpers
def ez_process(cmd: str) -> str:
    """Single point of entry for EZ PR processing."""
    return EzPR().process(cmd)


def quick_check():
    """Quick Vietnamese check command."""
    print(ez_process("xem pr"))


def quick_merge():
    """Quick Vietnamese merge command."""
    print(ez_process("merge tất cả"))
