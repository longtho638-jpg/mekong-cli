---
title: CLI Installation
description: "How to install and update AgencyOS CLI"
section: docs
category: cli
order: 1
published: true
ai_executable: true
---

# CLI Installation

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/cli/installation
```



Install AgencyOS CLI (Mekong-CLI) to download and manage AgencyOS starter kits.

## Prerequisites

Before installing, ensure you have:

- **Python 3.8+** - [Download from python.org](https://python.org)
- **pip** - Comes with Python
- **Git** - For repository access
- **AgencyOS purchase** - Required for full access from [agencyos.network](https://agencyos.network)

Verify installations:

```bash
python3 --version  # Should be 3.8+
pip --version
git --version
```

## Install CLI

### Clone Repository

```bash
git clone https://github.com/longtho638-jpg/mekong-cli.git
cd mekong-cli
pip install -r requirements.txt
```

### Verify Installation

```bash
python3 main.py --help
```

**Expected output:**
```
🌊 MEKONG-CLI: Deploy Your Agency in 15 Minutes

Commands:
  init             Initialize a new Hybrid Agent project
  setup-vibe       Customize the Agent's soul
  generate-secrets Interactive secret generation
  agents           List available AI agents
  ...
```

### Check Agents

```bash
python3 main.py agents
```

**Output:**
```
🤖 🌊 MEKONG-CLI AI Agents

   Quad-Agent System:
      🔍 Scout: Thu thập thông tin [Ready]
      ✏️ Editor: Biên tập nội dung [Ready]
      🎬 Director: Đạo diễn video [Ready]
      🤝 Community: Đăng bài & tương tác [Ready]

   Total: 7 agents ready
```

## Update CLI

Keep the CLI updated for latest features:

```bash
cd mekong-cli
git pull origin main
pip install -r requirements.txt
```

Check version:
```bash
python3 main.py --help
```

### Migration from .agencyos to .agencyos

If you had an older version with `.agencyos/` folder:

```bash
mv .agencyos .agencyos
```

## Configuration

AgencyOS CLI stores configuration in `.agencyos/` directory:

```
.agencyos/
├── agents/       # 18 AI agents
├── commands/     # 49+ slash commands
├── workflows/    # Workflow definitions
├── skills/       # Skill collections
├── hooks/        # Git/Discord/Telegram hooks
└── settings.json # CLI settings
```

## Uninstall

Remove AgencyOS CLI:

```bash
cd ..
rm -rf mekong-cli
```

Remove configuration (optional):
```bash
rm -rf ~/.agencyos
```

## Troubleshooting

### python3: command not found

**Solutions:**

1. **Install Python:**
   - macOS: `brew install python`
   - Windows: Download from python.org
   - Linux: `sudo apt install python3`

2. **Use python instead:**
   ```bash
   python main.py --help
   ```

### Module not found

**Problem:** Missing dependencies

**Solution:**
```bash
pip install -r requirements.txt
```

### Permission denied

**Problem:** Cannot clone or run

**Solutions:**

1. **Check Git access:**
   ```bash
   git config --global user.name
   git config --global user.email
   ```

2. **Use sudo (not recommended):**
   ```bash
   sudo pip install -r requirements.txt
   ```

## Next Steps

Now that the CLI is installed:

1. **Initialize a project** - Run `python3 main.py init`
2. **Check agents** - Run `python3 main.py agents`
3. **Start developing** - Follow [Getting Started](/docs/getting-started/installation)

## Need Help?

- **Documentation**: [agencyos.network](https://www.agencyos.network/docs)
- **GitHub Issues**: [github.com/longtho638-jpg/mekong-cli/issues](https://github.com/longtho638-jpg/mekong-cli/issues)

---

**Ready to start?** Run `python3 main.py init` to initialize your first project.
