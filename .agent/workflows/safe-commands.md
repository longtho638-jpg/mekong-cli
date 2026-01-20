---
description: Setup Antigravity safe command allowlist for controlled auto-run
---

# 🛡️ Antigravity Safe Commands Setup

Cấu hình danh sách lệnh an toàn để Antigravity tự động chạy mà không cần confirm, trong khi các lệnh nguy hiểm vẫn yêu cầu review.

// turbo-all

## 📋 Prerequisites

- Antigravity IDE đã cài đặt
- Quyền ghi vào settings.json

## 🚀 Quick Install (Recommended)

### macOS/Linux

```bash
curl -fsSL https://raw.githubusercontent.com/TUAN130294/antigravityallowlist/main/setup.sh | bash
```

### Windows (PowerShell as Admin)

```powershell
irm https://raw.githubusercontent.com/TUAN130294/antigravityallowlist/main/setup.ps1 | iex
```

## 🔧 Manual Steps (If Quick Install Fails)

### Step 1: Find Settings Location

```bash
# macOS
echo ~/Library/Application\ Support/Antigravity/User/settings.json

# Linux
echo ~/.config/Antigravity/User/settings.json
```

### Step 2: Backup Current Settings

```bash
# macOS
cp ~/Library/Application\ Support/Antigravity/User/settings.json ~/Library/Application\ Support/Antigravity/User/settings.json.backup

# Linux
cp ~/.config/Antigravity/User/settings.json ~/.config/Antigravity/User/settings.json.backup
```

### Step 3: Download Allowlist

```bash
# macOS
curl -fsSL https://raw.githubusercontent.com/TUAN130294/antigravityallowlist/main/settings.json -o /tmp/allowlist.json

# Merge with existing settings or replace
cat /tmp/allowlist.json
```

### Step 4: Configure Terminal Mode

1. Click **Antigravity Settings** (bottom right corner)
2. Select **Advanced Settings**
3. Go to **Agent** tab → **Terminal** section
4. Set to **Request Review**

### Step 5: Restart Antigravity

Close and reopen Antigravity IDE.

## ✅ Verification

Test these scenarios:

| Command       | Expected Behavior |
| ------------- | ----------------- |
| `npm run dev` | ✅ Auto-run       |
| `pnpm build`  | ✅ Auto-run       |
| `git status`  | ✅ Auto-run       |
| `rm -rf test` | ⚠️ Confirm popup  |
| `git push`    | ⚠️ Confirm popup  |

## ⚠️ Dangerous Commands (Always Confirm)

These commands are intentionally **NOT** in the allowlist:

- `rm`, `del`, `Remove-Item` - Delete files
- `git push`, `git reset --hard` - Modify remote/history
- `prisma migrate`, `prisma db push` - Database changes
- `npx`, `pnpm dlx`, `bun x` - Execute arbitrary packages
- `prettier --write`, `eslint --fix` - Modify files

## 💡 When You See Confirm Popup

1. **Copy** the command
2. **Ask AI**: "What does this command do?"
3. **Only confirm** if you understand and it's safe

## 📚 Resources

- [GitHub Repo](https://github.com/TUAN130294/antigravityallowlist)
- [Full Allowlist (~230 commands)](https://raw.githubusercontent.com/TUAN130294/antigravityallowlist/main/settings.json)

---

_Credits: TUAN130294 | Vibe Code Community_
