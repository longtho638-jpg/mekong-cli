"""
Mekong CLI - Supervisor (Autonomous Loop)

This script enables self-expanding capabilities.
Run by Antigravity to orchestrate Claude Code CLI.
"""

import os
import subprocess
from typing import List
from dataclasses import dataclass


@dataclass
class Manifesto:
    """Task definition for supervisor"""

    task: str
    priority: int = 1
    completed: bool = False


# DNA: Định nghĩa các nhiệm vụ cần làm
MANIFESTO: List[Manifesto] = [
    Manifesto(task="Tạo module 'LeadHunter': Input là domain, Output là email CEO.", priority=1),
    Manifesto(
        task="Tạo module 'ContentWriter': Input là keyword, Output là bài viết chuẩn SEO.",
        priority=2,
    ),
    Manifesto(
        task="Tạo lệnh CLI 'mekong ui': Mở một giao diện Terminal đẹp để chọn module.", priority=3
    ),
    Manifesto(
        task="Tạo module 'RecipeCrawler': Tự động tìm và download recipes từ community.", priority=4
    ),
]


def viber_loop():
    """
    Main execution loop - Viber Coding style.

    Iterates through MANIFESTO and delegates to Claude Code CLI.
    """
    print("=" * 60)
    print("🚀 MEKONG SUPERVISOR: Autonomous Genesis Protocol")
    print("=" * 60)

    for i, manifesto in enumerate(MANIFESTO, 1):
        if manifesto.completed:
            print(f"⏭️  Task {i}: Already completed")
            continue

        print(f"\n📋 Task {i}/{len(MANIFESTO)}: {manifesto.task}")
        print("-" * 40)

        # Build the prompt
        prompt = f"""Dựa trên cấu trúc 'src/core/agent_base.py' đã có, hãy {manifesto.task}. 
        
Yêu cầu:
1. Tự động tạo file trong thư mục phù hợp
2. Viết test cho module
3. Fix lỗi nếu có
4. Tuân thủ CLAUDE.md rules"""

        # Execute via Claude Code CLI
        # Note: Using --print-output for visibility
        cmd = f'claude "{prompt}" --print-output'

        print(f"🤖 Executing: claude ...")

        try:
            result = subprocess.run(
                cmd,
                shell=True,
                cwd=os.path.dirname(os.path.abspath(__file__)),
                capture_output=True,
                text=True,
                timeout=300,  # 5 minute timeout per task
            )

            if result.returncode == 0:
                print(f"✅ Task {i} completed successfully!")
                manifesto.completed = True
            else:
                print(f"❌ Task {i} failed: {result.stderr[:200]}")

        except subprocess.TimeoutExpired:
            print(f"⏰ Task {i} timed out after 5 minutes")
        except Exception as e:
            print(f"💥 Task {i} error: {e}")

    # Summary
    completed = sum(1 for m in MANIFESTO if m.completed)
    print("\n" + "=" * 60)
    print(f"📊 SUMMARY: {completed}/{len(MANIFESTO)} tasks completed")
    print("=" * 60)


if __name__ == "__main__":
    viber_loop()
