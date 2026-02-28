# DEEP TECH PRD: MEKONG-CLI GENESIS

**Target Repository:** `github.com/longtho638-jpg/mekong-cli`  
**Source DNA:** `claudekit.cc` (Private Repo/Codebase)  
**Executor:** Claude Code CLI (Authored by Anthropic, Driven by Antigravity)  
**Mission:** Biến `mekong-cli` thành công cụ dòng lệnh RaaS chuẩn mực cho Developer Việt Nam.

---

## 1. CẤU TRÚC GIẢI PHẪU (ANATOMY MAPPING)

```text
mekong-cli/
├── .idx/                   # [BRAIN] Cấu hình môi trường Antigravity (NixOS)
├── .claude/                # [MEMORY] Config để Claude Code hiểu dự án này
├── dna/                    # [GENE] Chứa các file trích xuất từ ClaudeKit (Tham khảo)
├── src/
│   ├── core/               # [HEART] Logic xử lý chính (Orchestrator)
│   │   ├── parser.py       # Đọc file Markdown Recipe
│   │   └── executor.py     # Gọi OpenClaw/Claude để chạy task
│   ├── commands/           # [HANDS] Các lệnh CLI (Typer/Click)
│   │   ├── run.py          # Lệnh `mekong run <recipe>`
│   │   └── init.py         # Lệnh `mekong init`
│   └── agents/             # [SKILLS] Các module RaaS (Lead, Content...)
├── recipes/                # [KNOWLEDGE] Các file quy trình mẫu (.md)
├── CLAUDE.md               # [RULE] Luật chơi cho Agent (Do ta tiêm vào)
└── pyproject.toml          # Quản lý dependencies (Poetry/Pip)
```

---

## 2. QUY TRÌNH "CẤY GHÉP DNA" (DNA INJECTION PROTOCOL)

### Bước 1: Chuẩn bị phòng thí nghiệm

- `/workspace/claudekit-src/`: Source code ClaudeKit (Chỉ đọc)
- `/workspace/mekong-cli/`: Repo target (Nơi ghi code)

### Bước 2: Trích xuất Gene (The Extraction)

```bash
claude "Tôi muốn bạn đóng vai 'Chief Architect'. Hãy đọc source code trong thư mục '../claudekit-src'.
Nhiệm vụ: Phân tích cách ClaudeKit cấu trúc một 'Agent', cách nó xử lý 'Tool Call', và cách nó quản lý 'Prompts'.
Output: Hãy tóm tắt logic đó và viết vào file '/workspace/mekong-cli/dna/ARCHITECTURE_NOTES.md'. Đừng copy code, hãy copy tư duy."
```

### Bước 3: Tiêm Gene vào Mekong (The Injection)

```bash
claude "Dựa trên 'ARCHITECTURE_NOTES.md' vừa tạo, hãy bắt đầu code dự án 'mekong-cli' bằng Python (sử dụng thư viện Typer và Rich).
1. Tạo cấu trúc thư mục chuẩn.
2. Tạo file 'src/core/agent_base.py': Đây là class cha cho mọi Agent.
3. Tạo file 'CLAUDE.md' ở root: Định nghĩa style code."
```

---

## 3. CƠ CHẾ TỰ TRỊ (AUTONOMOUS LOOP)

```python
# File: supervisor.py (Chạy bởi Antigravity)
import os
import subprocess

MANIFESTO = [
    "Tạo module 'LeadHunter': Input là domain, Output là email CEO.",
    "Tạo module 'ContentWriter': Input là keyword, Output là bài viết chuẩn SEO.",
    "Tạo lệnh CLI 'mekong ui': Mở một giao diện Terminal đẹp để chọn module."
]

def viber_loop():
    for task in MANIFESTO:
        print(f"🚀 Supervisor: Đang chỉ đạo Claude thực hiện task: {task}")
        prompt = f"Dựa trên cấu trúc 'src/core/agent_base.py' đã có, hãy {task}."
        cmd = f'claude "{prompt}" --print-output'
        os.system(cmd)

if __name__ == "__main__":
    viber_loop()
```

---

## 4. CHIẾN LƯỢC VIRAL

**"Clone & Earn":**

- Developer clone `mekong-cli` về
- Chạy `mekong init` → Nó tự setup môi trường Agent
- Chạy `mekong run recipes/lead_gen.md` → Nó tự đi cào khách hàng

**"The DNA Hook":**

- README ghi: _"Core của dự án này được kế thừa từ ClaudeKit (trị giá $XXX), nhưng được tối ưu hóa cho cộng đồng Agency Việt Nam."_

---

## ACTION ITEMS

1. ✅ Clone Repo (đã có `mekong-cli`)
2. 🔄 Tạo file `CLAUDE.md` gốc
3. 🔄 Kích hoạt Claude Code để khởi tạo

---

_Antigravity Chairman | Mekong Genesis Protocol_
