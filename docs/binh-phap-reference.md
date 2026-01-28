# 🏯 Binh Pháp Quick Reference

> **"Biết người biết ta, trăm trận không nguy"** - Strategic mapping for AgencyOS

| Chapter | Tên (VN) | Name (EN) | Principle | AgencyOS Application | Command |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Kế Hoạch** | Strategic Assessment | **Planning** | Project initiation, feasibility check | `/binh-phap:ke-hoach` |
| **2** | **Tác Chiến** | Resource Management | **Resources** | Runway, Budget, Cost optimization | `/binh-phap:tac-chien` |
| **3** | **Mưu Công** | Win Without Fighting | **Automation** | CI/CD, Strategic alliances, Leverage | `/binh-phap:muu-cong` |
| **4** | **Hình Thế** | Positioning | **Structure** | Architecture, Code standards, Rules | `/binh-phap:hinh-the` |
| **5** | **Thế Trận** | Momentum | **Force** | Growth metrics, KPIs, Viral loops | `/binh-phap:the-tran` |
| **6** | **Hư Thực** | Strengths/Weaknesses | **Testing** | Security, Rate limiting, Chaos engineering | `/binh-phap:hu-thuc` |
| **7** | **Quân Tranh** | Speed Execution | **Speed** | Caching, CDN, Fast deployments | `/binh-phap:quan-tranh` |
| **8** | **Cửu Biến** | Adaptability | **Flexibility** | Feature flags, A/B Testing, Pivots | `/binh-phap:cuu-bien` |
| **9** | **Hành Quân** | Operations | **Execution** | Background jobs, Queues, Monitoring | `/binh-phap:hanh-quan` |
| **10** | **Địa Hình** | Market Terrain | **Terrain** | Multi-tenancy, Environment handling | `/binh-phap:dia-hinh` |
| **11** | **Cửu Địa** | Crisis Management | **Context** | DR, Backup, 9 situational responses | `/binh-phap:cuu-dia` |
| **12** | **Hỏa Công** | Disruption Strategy | **Disruption** | Marketing, Notifications, Outreach | `/binh-phap:hoa-cong` |
| **13** | **Dụng Gián** | Intelligence | **Intel** | Logging, Analytics, User tracking | `/binh-phap:dung-gian` |

## 📊 Strategic Dashboard

Monitor the implementation status of the 13 Chapters using the CLI dashboard:

```bash
# Launch the interactive dashboard
python scripts/binh_phap_dashboard.py

# Watch mode (live updates)
python scripts/binh_phap_dashboard.py --watch

# View details for a specific chapter
python scripts/binh_phap_dashboard.py --chapter ke-hoach
```

The dashboard connects to the API endpoint `/api/v1/binh-phap/status` to fetch real-time status.

## 🎯 Usage Protocol

1.  **Identify the nature of the task.**
2.  **Select the corresponding Chapter.**
3.  **Execute the command** to load the specialized workflow.

```bash
# Example: Starting a new project (Chapter 1)
/binh-phap:ke-hoach "New E-commerce Platform"

# Example: Optimizing slow API (Chapter 7)
/binh-phap:quan-tranh "Optimize product search endpoint"

# Example: Handling server crash (Chapter 11)
/binh-phap:cuu-dia "Production DB is down"
```

## 📜 Constitution Mapping

The Binh Pháp system is deeply integrated into the **Antigravity Constitution**:

*   **ĐIỀU 0-1 (Planning):** Chapter 1 (Kế Hoạch)
*   **ĐIỀU 2-18 (Structure):** Chapter 4 (Hình Thế)
*   **ĐIỀU 19-22 (Execution):** Chapter 9 (Hành Quân)
*   **ĐIỀU 24 (Logistics):** Chapter 2 (Tác Chiến)
*   **ĐIỀU 28 (Context):** Chapter 11 (Cửu Địa)
*   **ĐIỀU 35 (Monitoring):** Chapter 13 (Dụng Gián)

---
*Created: 2026-01-27 | Status: Active*
