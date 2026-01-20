# Auto-Accept Mode

> **QUAN TRỌNG: Mặc định BẬT - Agent tự động chạy lệnh không hỏi**

## Allowed Commands (Auto-Accept)
| Loại lệnh | Examples |
|-----------|----------|
| **Scripts** | `python3`, `node` scripts |
| **Read/View** | `ls`, `cat`, `head`, `tail`, `grep`, File read |
| **Git Read** | `git status`, `git log`, `git diff` |
| **Testing** | `pytest`, `npm test` |
| **Build** | `npm run build` |
| **System** | LaunchAgent reload |

## Restricted Commands (Must Ask)
| Loại lệnh | Examples |
|-----------|----------|
| **Destructive** | `rm`, `delete`, `rm -rf` |
| **Git Write** | `git push`, `git commit` |
| **Deployment** | Deploy to production |
| **Install** | `brew install`, System packages |

## User Control
User can disable by saying:
- "Tắt auto-accept đi em"
- "Hỏi trước khi chạy lệnh"
- "Stop auto mode"
