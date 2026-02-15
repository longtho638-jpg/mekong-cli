# Cloud AGI Deployment Guide 🦞☁️

> **⚠️ DEPRECATED (Feb 2026):**
> This "Ultra Proxy" method is deprecated.
> Use the **Direct Cloud Brain** method instead: `./scripts/switch_to_cloud.sh`
> See `VIBE_CODING_CLOUD_KIT.md` for details.

This guide explains how to deploy the **OpenClaw AGI Loop** ("The Box") to a cloud provider for eternal operation.

## Prerequisites
- Docker installed locally (for testing).
- A Cloud Provider account (Railway, Fly.io, or a VPS with Docker).
- The "Ultra Proxy" Session Key (`cashback.mentoring@gmail.com`).

## 1. Extract Your Session Key
To authenticate the Cloud Brain as "Ultra Proxy", you need your current session key.
Run this on your local machine (if you are logged in):
```bash
cat ~/.claude/auth.json | grep sessionKey
# OR copy it from your existing config if using a different path
```
*Note: If you cannot find it, you may need to log in again inside the container or manually export it from the browser cookies (`sessionKey` cookie on claude.ai).*

## 2. Build & Test Locally
Use the provided `Dockerfile.agi` to build the image:
```bash
# Build the image
docker build -f apps/openclaw-worker/Dockerfile.agi -t openclaw-agi .

# Run it (Interactive)
# Replace 'sk-ant-...' with your actual key
docker run -it \
  -e CLAUDE_SESSION_KEY="sk-ant-..." \
  -e PROXY_PORT=8081 \
  openclaw-agi
```
You should see:
- Proxy starting on port 8081.
- Brain spawning in `tmux`.
- Logs streaming to stdout.

## 3. Deploy to Cloud

### Option A: Railway (Recommended)
1.  Create a new project on Railway.
2.  Connect your GitHub repo.
3.  Set the **Dockerfile Path** to `apps/openclaw-worker/Dockerfile.agi`.
4.  Add Environment Variable: `CLAUDE_SESSION_KEY` = `your-session-key-here`.
5.  Deploy!

### Option B: VPS (DigitalOcean/Hetzner)
1.  SSH into your VPS.
2.  Clone the repo.
3.  Run the `docker run` command from step 2, adding `-d --restart unless-stopped` to keep it running forever.

## 4. Monitoring
- View logs in your Cloud Provider's dashboard.
- The AGI Supervisor is completely autonomous. It will generate `agi_evolution` tasks and execute them eternally.
