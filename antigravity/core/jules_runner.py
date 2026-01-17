'''
🤖 Jules Runner - Automated Technical Debt Management
=====================================================

Orchestrates automated maintenance missions using the Jules AI agent. 
Automatically schedules and executes tasks for test generation, linting, 
documentation, and dependency updates.

Core Missions:
- 🧪 Tests: Ensuring high coverage for new features.
- 🖋️ Lint: Enforcing Python and TypeScript standards.
- 📄 Docs: Keeping docstrings and READMEs synchronized.
- 📦 Deps: Patching security vulnerabilities in dependencies.

Binh Pháp: 🤖 Vô Vi (Automation) - Maintaining the army without effort.
'''

import logging
import subprocess
import argparse
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

# Standard Jules Mission Templates
JULES_MISSIONS = {
    "tests": {
        "label": "Tạo Unit Tests tự động",
        "description": "Bổ sung unit tests cho các file core mới.",
        "prompt": "add comprehensive unit tests for all new files in antigravity/core/ that don't have tests",
        "schedule": "Thứ Hai (Monday)",
    },
    "lint": {
        "label": "Sửa lỗi Type & Lint",
        "description": "Chuẩn hóa Python type hints và fix TS 'any' types.",
        "prompt": "fix all TypeScript any types and Python type hints in the codebase",
        "schedule": "Thứ Tư (Wednesday)",
    },
    "docs": {
        "label": "Cập nhật Tài liệu (Docs)",
        "description": "Bổ sung docstrings và hướng dẫn sử dụng module.",
        "prompt": "add docstrings to all Python functions missing documentation in antigravity/core/",
        "schedule": "Thứ Sáu (Friday)",
    },
    "security": {
        "label": "Quét & Vá bảo mật",
        "description": "Kiểm tra lỗ hổng npm/pip và thông tin nhạy cảm.",
        "prompt": "fix all security vulnerabilities from npm audit and scan for hardcoded secrets",
        "schedule": "Hàng tháng (Ngày 15)",
    },
    "cleanup": {
        "label": "Dọn dẹp mã nguồn",
        "description": "Xóa code thừa, imports không dùng và log rác.",
        "prompt": "remove all unused imports, dead code, and console.log statements",
        "schedule": "Cuối tuần (Saturday)",
    },
}


def trigger_jules_mission(mission_id: str, dry_run: bool = False) -> bool:
    """
    Submits a specific maintenance mission to the Jules agent.
    """
    if mission_id not in JULES_MISSIONS:
        logger.error(f"Unknown mission: {mission_id}")
        return False

    mission = JULES_MISSIONS[mission_id]

    print(f"\n🤖 KHỞI TẠO NHIỆM VỤ JULES: {mission['label']}")
    print(f"   Mô tả    : {mission['description']}")
    print(f"   Lịch trình: {mission['schedule']}")

    # Building the CLI command for Jules
    cmd = f'gemini -p "/jules {mission["prompt"]}"'

    if dry_run:
        print("\n   [CHẾ ĐỘ THỬ NGHIỆM] Lệnh sẽ chạy:")
        print(f"   $ {cmd}")
        return True

    try:
        print("\n   🚀 Đang gửi yêu cầu cho Jules... Vui lòng đợi.")
        # Timeout is long because Jules might take time to initialize the task
        # Security: Use argument list to prevent command injection
        result = subprocess.run(
            ["gemini", "-p", f"/jules {mission['prompt']}"],
            capture_output=True,
            text=True,
            timeout=180
        )

        if result.returncode == 0:
            print("   ✅ Gửi nhiệm vụ thành công!")
            print("   📋 Theo dõi tiến độ tại: https://jules.google.com")
            return True
        else:
            print(f"   ❌ Lỗi hệ thống: {result.stderr}")
            return False

    except subprocess.TimeoutExpired:
        print("   ⏱️ Đã gửi nhiệm vụ (đang chạy ngầm trong hệ thống Jules)")
        return True
    except Exception:
        logger.exception("Critical failure in Jules Runner")
        return False


def run_scheduled_maintenance(dry_run: bool = False):
    """Identifies and runs the mission assigned to the current day."""
    day_en = datetime.now().strftime("%A")

    schedule_map = {
        "Monday": "tests",
        "Wednesday": "lint",
        "Friday": "docs",
        "Saturday": "cleanup"
    }

    mission = schedule_map.get(day_en)

    if mission:
        print(f"📅 Hôm nay là {day_en}. Bắt đầu bảo trì định kỳ...")
        return trigger_jules_mission(mission, dry_run)

    print(f"📅 Hôm nay ({day_en}) không có lịch bảo trì định kỳ.")
    return True


def check_jules_status():
    """Queries the current status of all Jules tasks."""
    print("🔍 Đang kiểm tra trạng thái nhiệm vụ...")
    try:
        # Security: Use argument list to prevent command injection
        result = subprocess.run(
            ["gemini", "-p", "/jules what is the status of my tasks?"],
            capture_output=True,
            text=True,
            timeout=60
        )
        print(result.stdout)
    except Exception as e:
        print(f"❌ Lỗi khi kiểm tra: {e}")


def list_mission_catalog():
    """Displays all possible automated maintenance missions."""
    print("\n" + "═" * 60)
    print("║" + "🤖 DANH MỤC BẢO TRÌ TỰ ĐỘNG (JULES)".center(58) + "║")
    print("═" * 60)

    for mid, m in JULES_MISSIONS.items():
        print(f"\n  🔹 {mid.upper()}: {m['label']}")
        print(f"     └─ {m['description']}")
        print(f"     └─ Lịch: {m['schedule']}")

    print("\n" + "═" * 60 + "\n")


def main():
    """CLI Interface for Jules Runner."""
    parser = argparse.ArgumentParser(description="Agency OS - Jules Runner")
    parser.add_argument("-m", "--mission", help="ID của nhiệm vụ cần chạy (tests, lint, docs, etc.)")
    parser.add_argument("-a", "--auto", action="store_true", help="Chạy nhiệm vụ theo lịch hôm nay")
    parser.add_argument("-l", "--list", action="store_true", help="Xem danh mục nhiệm vụ")
    parser.add_argument("-s", "--status", action="store_true", help="Kiểm tra trạng thái Jules")
    parser.add_argument("--dry", action="store_true", help="Chạy thử không thực thi")

    args = parser.parse_args()

    if args.list:
        list_mission_catalog()
    elif args.status:
        check_jules_status()
    elif args.auto:
        run_scheduled_maintenance(args.dry)
    elif args.mission:
        trigger_jules_mission(args.mission, args.dry)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
