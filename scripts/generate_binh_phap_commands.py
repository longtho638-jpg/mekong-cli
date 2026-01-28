import os

chapters = [
    ("ke-hoach", "Strategic Assessment (Kế Hoạch)"),
    ("tac-chien", "Resource Management (Tác Chiến)"),
    ("muu-cong", "Win Without Fighting (Mưu Công)"),
    ("hinh-the", "Positioning (Hình Thế)"),
    ("the-tran", "Momentum (Thế Trận)"),
    ("hu-thuc", "Strengths & Weaknesses (Hư Thực)"),
    ("quan-tranh", "Speed Execution (Quân Tranh)"),
    ("cuu-bien", "Adaptability (Cửu Biến)"),
    ("hanh-quan", "Operations (Hành Quân)"),
    ("dia-hinh", "Market Terrain (Địa Hình)"),
    ("cuu-dia", "Crisis Management (Cửu Địa)"),
    ("hoa-cong", "Disruption Strategy (Hỏa Công)"),
    ("dung-gian", "Intelligence (Dụng Gián)"),
]

command_dir = ".claude/commands/binh-phap"
os.makedirs(command_dir, exist_ok=True)

for slug, desc in chapters:
    content = f"""---
description: 🏯 {desc} - Chapter {chapters.index((slug, desc)) + 1}
---

# /{slug} - {desc}

> **Binh Pháp Chapter {chapters.index((slug, desc)) + 1}**

## Description
Executes the strategic workflow for **{desc}**.

## Workflow
This command delegates to the specialized agent workflow:
`@.agent/workflows/binh-phap/{slug}.md`

## Usage
```bash
/{slug} [optional context]
```

## Action
1. Analyzes the current situation using {desc} principles.
2. Generates specific action items.
3. Updates the implementation plan.
"""
    file_path = os.path.join(command_dir, f"{slug}.md")
    with open(file_path, "w") as f:
        f.write(content)
    print(f"Created {file_path}")
