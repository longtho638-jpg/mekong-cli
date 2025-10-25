# Claude Code Notification Hooks

This directory contains notification hooks for Claude Code sessions. These hooks send real-time notifications to Discord and Telegram when Claude completes tasks.

## Overview

Claude Code hooks automate notifications and actions at specific points in your development workflow. This project includes two notification systems:

| Hook | File | Type | Description |
|------|------|------|-------------|
| **Discord** | `send-discord.sh` | Manual | Sends rich embedded completion summaries to Discord channel |
| **Telegram** | `telegram_notify.sh` | Automated | Auto-sends detailed notifications on session/subagent completion |

## Quick Start

### Discord Hook
Send manual notifications to Discord with custom messages.

**Setup:** [discord-hook-setup.md](./discord-hook-setup.md)

**Quick Test:**
```bash
./.claude/hooks/send-discord.sh 'Test notification'
```

### Telegram Hook
Automatic notifications on Claude Code session events.

**Setup:** [telegram-hook-setup.md](./telegram-hook-setup.md)

**Quick Test:**
```bash
echo '{"hookType":"Stop","projectDir":"'$(pwd)'","sessionId":"test","toolsUsed":[]}' | ./.claude/hooks/telegram_notify.sh
```

## Documentation

### Detailed Setup Guides

- **[Discord Hook Setup](./discord-hook-setup.md)** - Complete Discord webhook configuration
- **[Telegram Hook Setup](./telegram-hook-setup.md)** - Complete Telegram bot configuration

### What's Included in Each Guide

**Discord Hook Guide:**
- Discord webhook creation
- Environment configuration
- Manual & automated usage
- Message formatting
- Troubleshooting
- Advanced customization

**Telegram Hook Guide:**
- Telegram bot creation
- Chat ID retrieval
- Global vs project config
- Hook event configuration
- Testing procedures
- Security best practices

## Features Comparison

| Feature | Discord Hook | Telegram Hook |
|---------|--------------|---------------|
| **Trigger Type** | Manual invocation | Automatic on events |
| **Message Style** | Rich embeds | Markdown formatted |
| **Setup Complexity** | Simple (webhook only) | Medium (bot + chat ID) |
| **Use Case** | Custom summaries | Session monitoring |
| **Events** | On-demand | Stop, SubagentStop |
| **Tool Tracking** | No | Yes |
| **File Tracking** | No | Yes |

## Scripts

### send-discord.sh
Manual Discord notification script with rich embed formatting.

**Usage:**
```bash
./.claude/hooks/send-discord.sh 'Your message here'
```

**Required:** `DISCORD_WEBHOOK_URL` environment variable

### telegram_notify.sh
Automated Telegram notification hook for Claude Code events.

**Triggers:**
- `Stop` - Main session completion
- `SubagentStop` - Subagent task completion

**Required:** `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` environment variables

## Configuration

### Environment Variables

Create `.env` file in project root:

```bash
# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=987654321
```

### Claude Code Hooks Config

Create or update `.claude/config.json`:

```json
{
  "hooks": {
    "Stop": {
      "command": "./.claude/hooks/telegram_notify.sh",
      "background": true
    },
    "SubagentStop": {
      "command": "./.claude/hooks/telegram_notify.sh",
      "background": true
    }
  }
}
```

## Security

**⚠️ Important Security Practices:**

1. **Never commit tokens/webhooks:**
   ```bash
   # Add to .gitignore
   .env
   .env.*
   ```

2. **Use environment variables** - Never hardcode credentials

3. **Rotate tokens regularly** - Regenerate periodically

4. **Limit permissions** - Minimum required access only

5. **Monitor usage** - Check for unauthorized activity

See individual setup guides for detailed security recommendations.

## Troubleshooting

### Common Issues

**"Environment variable not set"**
- Verify `.env` file exists and is properly formatted
- Reload shell after updating profile files (`source ~/.bashrc`)

**"jq: command not found"** (Telegram only)
- Install jq: `brew install jq` (macOS) or `apt-get install jq` (Linux)

**No messages received**
- Verify tokens/webhooks are valid
- Check network connectivity
- Ensure proper permissions

### Getting Help

- Check individual setup guides for detailed troubleshooting
- Review [Claude Code Documentation](https://docs.claude.com/claude-code)
- Report issues at [Claude Code GitHub](https://github.com/anthropics/claude-code/issues)

## Additional Resources

- [Claude Code Documentation](https://docs.claude.com/claude-code)
- [Claude Code Hooks Reference](https://docs.claude.com/claude-code/hooks)
- [Discord Webhooks Guide](https://discord.com/developers/docs/resources/webhook)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

**Last Updated:** 2025-10-22
