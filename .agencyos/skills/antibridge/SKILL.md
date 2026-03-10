---
name: antibridge
description: Control Antigravity AI Agent from any browser or mobile device. Bridge between you and Antigravity with real-time chat, remote access via Tailscale, and auto-reconnect. Use when setting up mobile access to your AI coding agent.
license: MIT
version: 1.2.0
based_on: https://github.com/linhbanbanhbao/AntiBridge
---

# 🌉 AntiBridge Skill

Control your Antigravity AI Agent from any browser on the same network, or remotely via Tailscale.

## When to Use This Skill

Use this skill when:

- Accessing Antigravity from your phone
- Setting up remote access to your AI agent
- Troubleshooting AntiBridge connection
- Configuring Tailscale for anywhere access

## Features

- **💬 Real-time Chat**: Send commands and get AI responses instantly
- **📝 Markdown Rendering**: Code blocks, tables with syntax highlighting
- **💾 Chat History**: Conversations persist across sessions
- **🔄 Auto-reconnect**: Automatic reconnection when dropped
- **🌓 Dark Theme**: Easy on eyes for long sessions
- **🌐 Remote Access**: Tailscale for secure anywhere access

## Quick Start

### 1. First-time Setup

```batch
REM Run SETUP.bat to install dependencies (only once)
SETUP.bat
```

### macOS Quick Start

```bash
# 1. Setup (one-time)
cd scripts/antibridge
chmod +x *.sh
./SETUP_MAC.sh

# 2. Open Antigravity with CDP
./OPEN_ANTIGRAVITY_MAC.sh

# 3. Start server
./START_MAC.sh

# 4. Access from phone
# LAN: http://YOUR_MAC_IP:8000
# Tailscale: http://100.x.x.x:8000 (run: tailscale ip -4)
```

### 2. Start Antigravity with CDP

```batch
REM Double-click to open Antigravity with remote debugging
OPEN_ANTIGRAVITY.vbs
```

### 3. Start Server

```batch
REM Right-click > Run as administrator
START.bat
```

### 4. Open in Browser

- **Same PC**: http://localhost:8000
- **Other device**: http://YOUR_PC_IP:8000 (find IP with `ipconfig`)

## Remote Access with Tailscale

### Setup Steps

1. **Install Tailscale** on both devices:
    - PC: https://tailscale.com/download/windows
    - Phone: https://tailscale.com/download

2. **Login** with same account on both devices

3. **Get Tailscale IP** of your PC:
    - Open Tailscale on PC
    - Note the IP (usually `100.x.x.x`)

4. **Access from anywhere**:
    ```
    http://100.x.x.x:8000
    ```

### Benefits

- ✅ **Secure**: End-to-end encrypted
- ✅ **No port forwarding**: Works through NAT
- ✅ **Free tier**: 100 devices free
- ✅ **Mobile data**: Works from anywhere with internet

## Requirements

- **Node.js 18+**: https://nodejs.org/
- **Antigravity IDE**: Your AI coding agent
- **Windows 10/11**
- **Tailscale** (optional): For remote access

## Project Structure

```
AntiBridge/
├── START.bat          # Start the server
├── SETUP.bat          # First-time setup
├── OPEN_ANTIGRAVITY.vbs # Open Antigravity with CDP
├── backend/
│   ├── server.js      # Main server file
│   ├── routes/        # API endpoints
│   └── services/      # Business logic
├── frontend/
│   ├── index.html     # Main page
│   ├── css/           # Styles
│   └── js/            # JavaScript
├── scripts/           # Injection scripts
└── assets/            # Logo and icons
```

## Troubleshooting

### Server won't start

```bash
# Check Node.js version
node --version   # Should be 18+

# Re-run setup
SETUP.bat
```

### Can't connect from browser

1. Check if server is running (look for console window)
2. Make sure firewall allows port 8000
3. Try http://localhost:8000 first

### AI responses not showing

1. Make sure Antigravity is running with CDP (use `OPEN_ANTIGRAVITY.vbs`)
2. Check server console for CDP connection status

## Security Notes

- ⚠️ **Local Network Only**: Designed for local network use
- ⚠️ **No Internet Exposure**: Never expose port 8000 to internet
- ⚠️ **Trusted Network**: No authentication (use on trusted networks)
- ✅ **Tailscale**: Safe for remote access (encrypted tunnel)

## Resources

- **GitHub**: https://github.com/linhbanbanhbao/AntiBridge
- **Tailscale**: https://tailscale.com/
- **Node.js**: https://nodejs.org/
