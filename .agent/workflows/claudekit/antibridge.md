---
description: name: antibridge
---

# Claudekit Command: /antibridge

> Imported from claudekit-engineer

# /antibridge Command

Control Antigravity AI Agent from any browser or mobile device.

## Usage

```
/antibridge              # Quick start guide
/antibridge setup        # First-time setup
/antibridge remote       # Tailscale remote access
/antibridge troubleshoot # Fix common issues
```

## Examples

### First-time Setup

```
/antibridge setup
```

This will guide you through:

1. Running SETUP.bat for dependencies
2. Opening Antigravity with CDP
3. Starting the server
4. Accessing from browser

### Remote Access Setup

```
/antibridge remote
```

This will guide you through:

1. Installing Tailscale
2. Connecting devices
3. Finding your Tailscale IP
4. Accessing from anywhere

### Troubleshooting

```
/antibridge troubleshoot
```

Common fixes:

- Server won't start → Check Node.js version
- Can't connect → Check firewall port 8000
- AI not responding → Use OPEN_ANTIGRAVITY.vbs

## Quick Reference

| Action            | Command/File           |
| ----------------- | ---------------------- |
| First-time setup  | `SETUP.bat`            |
| Start Antigravity | `OPEN_ANTIGRAVITY.vbs` |
| Start server      | `START.bat` (as admin) |
| Local access      | http://localhost:8000  |
| Remote access     | http://100.x.x.x:8000  |

## Related Skills

- `devops` - Server deployment
- `mobile-development` - Mobile app patterns
