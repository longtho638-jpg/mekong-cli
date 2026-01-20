# Bridge Sync Rules

> **"Đồng bộ là sức mạnh" - AntigravityKit Integration**

## 1. Sync Principles
- **Always Map**: Mọi phát triển phải ánh xạ với AntigravityKit modules.
- **Core First**: Sử dụng DNA, Magnet, Revenue engine gốc.
- **Unified**: AgencyOS và AgencyEr dùng chung commands.

## 2. Sync Schedule
| Frequency | Action |
|-----------|--------|
| **Daily** | Check for updates |
| **Weekly** | Full module sync (Sunday 00:00 UTC) |
| **Release** | Immediate sync on new tag |
| **Manual** | `/antigravity-sync` command |

## 3. Bridge Status Check
Check parity between Claude (24 agents) and Gemini (105 agents).
- **Missing in Gemini**: Identify gaps (e.g., content-factory, git-manager).
- **Goal**: Full parity or strategic delegation.

## 4. Automation
- `on_trigger`: new_release, weekly_cron
- `sync_targets`: mekong-cli-new, agency-cli, agencyos-starter
