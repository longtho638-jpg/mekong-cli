# 🏯 DOANH TRẠI TÔM HÙM — Military Organization Chart

> **"Tướng giỏi không cần quân đông, chỉ cần quân tinh"**
>
> Tổ chức quân đội nghĩa quân OpenClaw Swarm
> Effective: 2026-02-11 | Version: 1.0.0

---

## 📊 Sơ Đồ Tổ Chức

```
🏯 DOANH TRẠI TÔM HÙM (OpenClaw Swarm HQ)
│
├── 👑 CHỦ SOÁI — Antigravity (Gemini 2.5 Pro / Opus 4.6)
│   ├── 📜 Hiến Pháp: Antigravity Constitution (53 ĐIỀU)
│   ├── 📖 Binh Pháp: 13 Chương Master Reference
│   ├── 🐲 Chiến Thuật: 36 Kế Tôm Hùm
│   └── ⚖️ Quân Luật: 9 Điều Quân Lệnh
│
├── 🧠 QUÂN SƯ — Brain-Tmux v29.4
│   ├── State Machine: DISPATCHED → BUSY → DONE
│   ├── Context Mgmt: /clear every 3, /compact every 5
│   ├── Crash Recovery: auto-respawn with --continue (5/hr)
│   │
│   ├── ⚔️ TƯỚNG TIÊN PHONG (Pane 0)
│   │   ├── Model: claude-sonnet-4-5 (hoặc opus-4-6)
│   │   ├── Missions: /review, /plan:hard, /debug, complex /cook
│   │   └── Ưu tiên: COMPLEX + THINKER tasks
│   │
│   └── ⚔️ TƯỚNG HẬU CẦN (Pane 1)
│       ├── Model: claude-sonnet-4-5
│       ├── Missions: /docs:update, simple /cook, /test
│       └── Ưu tiên: SIMPLE + WORKER tasks
│
├── ⚔️ TIỀN ĐỘI — Front Line (High Frequency)
│   │
│   ├── 🏹 TRINH SÁT (Hunter Daemon)
│   │   ├── Rank: TRINH_SAT
│   │   ├── Interval: 60s
│   │   ├── Model: Gemini 3 Flash (AG Proxy TIER_1)
│   │   ├── Territory: Code pattern scanning (regex)
│   │   ├── Input: Source files across ALL_PROJECTS
│   │   ├── Output: mission_<project>_hunter_*.txt → tasks/
│   │   ├── Signal: BUG_REPORT → builder
│   │   └── Kế: #3 Mượn đao, #13 Đả thảo, #16 Dục cầm
│   │
│   ├── 📋 ĐIỀU PHỐI (Dispatcher Daemon)
│   │   ├── Rank: DIEU_PHOI
│   │   ├── Interval: 10s
│   │   ├── Model: Gemini 3 Flash (AG Proxy TIER_1)
│   │   ├── Territory: Task queue ordering + priority
│   │   ├── Input: tasks/*.txt
│   │   ├── Output: Sorted queue → brain-tmux
│   │   ├── Signal: MISSION_READY → brain-tmux
│   │   └── Kế: #4 Dĩ dật, #35 Liên hoàn
│   │
│   └── 🛡️ LÍNH CANH (Operator Daemon)
│       ├── Rank: LINH_CANH
│       ├── Interval: 5min
│       ├── Model: Gemini 3 Flash (AG Proxy TIER_1)
│       ├── Territory: System health, processes, disk
│       ├── Input: System metrics (top, df, thermal)
│       ├── Output: Health reports
│       ├── Signal: HEALTH_ALERT → all
│       └── Kế: #6 Thanh đông, #15 Điều hổ, #21-22, #32, #36
│
├── 🔨 TRUNG QUÂN — Core Force (Medium Frequency)
│   │
│   ├── 🏗️ CÔNG BINH (Builder Daemon)
│   │   ├── Rank: CONG_BINH
│   │   ├── Interval: 45min
│   │   ├── Model: Gemini 3 Flash (AG Proxy TIER_2)
│   │   ├── Territory: Tech debt, TODOs, large files
│   │   ├── Input: Hunter signals + own scans
│   │   ├── Output: mission_<project>_builder_*.txt → tasks/
│   │   ├── Signal: CLEANUP_DONE → reviewer
│   │   └── Kế: #1 Man thiên, #5 Thừa lửa, #12 Thuận thủ, #24-25, #28, #34
│   │
│   ├── 👮 HIẾN BINH (Reviewer Daemon)
│   │   ├── Rank: HIEN_BINH
│   │   ├── Interval: 30min
│   │   ├── Model: Gemini 3 Flash (AG Proxy TIER_2)
│   │   ├── Territory: Code quality auditing
│   │   ├── Input: Random files from ALL_PROJECTS
│   │   ├── Output: mission_<project>_review_*.txt → tasks/
│   │   ├── Signal: REVIEW_REQUEST → builder
│   │   └── Kế: #8 Ám độ, #10 Tiếu lý
│   │
│   └── 📝 THƯ KÝ (Scribe Daemon)
│       ├── Rank: THU_KY
│       ├── Interval: 10min
│       ├── Model: Gemini 3 Flash (AG Proxy TIER_1)
│       ├── Territory: Logs → summarized memory
│       ├── Input: ~/tom_hum_cto.log + daemon logs
│       ├── Output: memory/*.json
│       ├── Signal: MEMORY_UPDATED → sage
│       └── Kế: #27 Giả si
│
├── 🎓 HẬU CẦN — Support (Low Frequency)
│   │
│   ├── 📜 NGOẠI GIAO (Diplomat Daemon)
│   │   ├── Rank: NGOAI_GIAO
│   │   ├── Interval: 1h
│   │   ├── Model: Gemini 3 Flash (AG Proxy TIER_1)
│   │   ├── Territory: Documentation files
│   │   ├── Input: README.md, docs/, CHANGELOG
│   │   ├── Output: mission_<project>_docs_*.txt → tasks/
│   │   ├── Signal: DOCS_OUTDATED → builder
│   │   └── Kế: #7 Vô trung, #17 Phao chuyên
│   │
│   ├── 💰 QUÂN NHU (Merchant Daemon)
│   │   ├── Rank: QUAN_NHU
│   │   ├── Interval: 1h
│   │   ├── Model: Gemini 3 Flash (AG Proxy TIER_1)
│   │   ├── Territory: Payment/revenue data
│   │   ├── Input: Stripe/PayOS/Polar webhooks
│   │   ├── Output: Revenue reports
│   │   ├── Signal: REVENUE_ALERT → scribe
│   │   └── Kế: #20 Hỗn thủy, #23 Viễn giao, #30 Phản khách
│   │
│   └── 🎨 HỌA SĨ (Artist Daemon)
│       ├── Rank: HOA_SI
│       ├── Interval: 3h
│       ├── Model: Gemini 3 Flash (AG Proxy TIER_1)
│       ├── Territory: CSS, UI, screenshots
│       ├── Input: Playwright screenshots of deployed sites
│       ├── Output: mission_<project>_ui_*.txt → tasks/
│       ├── Signal: UI_ISSUE → builder
│       └── Kế: #29 Thụ thượng, #31 Mỹ nhân
│
└── 📚 THAM MƯU — Intelligence (Deep Thinking)
    │
    ├── 🏛️ KIẾN TRÚC SƯ (Architect Daemon)
    │   ├── Rank: KIEN_TRUC_SU
    │   ├── Interval: 4h
    │   ├── Model: Gemini 3 Pro HIGH (AG Proxy TIER_3)
    │   ├── Territory: System structure, modularity
    │   ├── Input: File tree, dependency graph
    │   ├── Output: Architecture reports + mission files
    │   ├── Signal: ARCH_ISSUE → builder
    │   └── Kế: #2 Vây Ngụy, #11 Lý đại, #14 Tá thi, #18-19
    │
    └── 🧙 HIỀN TRIẾT (Sage Daemon)
        ├── Rank: HIEN_TRIET
        ├── Interval: 6h
        ├── Model: Gemini 3 Pro HIGH (AG Proxy TIER_3)
        ├── Territory: Knowledge base, KIs, patterns
        ├── Input: Antigravity knowledge/, memory/
        ├── Output: Synthesized insights
        ├── Signal: INTEL → all
        └── Kế: #9 Cách ngạn, #26 Chỉ tang, #33 Phản gián
```

---

## 🔄 Luồng Tín Hiệu (Signal Flow)

```
Hunter ──BUG_REPORT──→ Builder ──CLEANUP_DONE──→ Reviewer
  │                        │
  └──BUG_REPORT──→ Dispatcher ──MISSION_READY──→ Brain-Tmux
                       ↑                              │
Architect ──ARCH_ISSUE─┘                     CC CLI Pane 0/1
Diplomat ──DOCS_OUTDATED─┘                         │
Artist ──UI_ISSUE────────┘                    COMPLETE
Operator ──HEALTH_ALERT──→ ALL (broadcast)         │
Scribe ──MEMORY_UPDATED──→ Sage ──INTEL──→ Antigravity
Merchant ──REVENUE_ALERT──→ Scribe
```

---

## 📋 Bảng Chấm Công (Duty Roster)

| Tần Suất | Daemon     | Rank         | Model     | Budget/call |
| :------- | :--------- | :----------- | :-------- | :---------- |
| 10s      | Dispatcher | DIEU_PHOI    | Flash     | 500 tokens  |
| 60s      | Hunter     | TRINH_SAT    | Kimi K2.5 | 2000 tokens |
| 5min     | Operator   | LINH_CANH    | Flash     | 1000 tokens |
| 10min    | Scribe     | THU_KY       | Flash     | 1500 tokens |
| 30min    | Reviewer   | HIEN_BINH    | Flash     | 2000 tokens |
| 45min    | Builder    | CONG_BINH    | Flash     | 2000 tokens |
| 1h       | Diplomat   | NGOAI_GIAO   | Flash     | 2000 tokens |
| 1h       | Merchant   | QUAN_NHU     | Flash     | 1500 tokens |
| 3h       | Artist     | HOA_SI       | Flash     | 2000 tokens |
| 4h       | Architect  | KIEN_TRUC_SU | Flash     | 3000 tokens |
| 6h       | Sage       | HIEN_TRIET   | Flash     | 3000 tokens |

---

_Doanh Trại Tôm Hùm v1.0.0 | OpenClaw Military Organization | 2026-02-11_
