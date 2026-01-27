# 🛠️ Antigravity Setup Troubleshooting Guide

> **"Khó khăn là cơ hội để hệ thống trở nên mạnh mẽ hơn."** - Binh Pháp Engineering

This guide addresses common issues encountered when running the `setup-antigravity.sh` bootloader script.

## 🚨 Critical Failures (Red Light)

### 1. "Permission Denied" when running script
**Symptom:**
```bash
bash: ./setup-antigravity.sh: Permission denied
```
**Solution:**
The script is not executable. Run:
```bash
chmod +x scripts/setup-antigravity.sh
./scripts/setup-antigravity.sh
```

### 2. "RAM: X GB. Insufficient."
**Symptom:**
The script halts with a RAM error.
**Cause:**
Antigravity requires minimum 16GB RAM to run local agents and docker containers efficiently.
**Bypass (Not Recommended):**
Edit the script to lower the threshold in `check_hardware` function, but expect performance degradation.

### 3. Docker Daemon Connection Failure
**Symptom:**
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
```
**Solution:**
- **macOS:** Open "Docker Desktop" application. Ensure the whale icon is in the status bar.
- **Linux:** Start the service: `sudo systemctl start docker`
- **Permissions:** Ensure your user is in the docker group: `sudo usermod -aG docker $USER` (requires logout).

## ⚠️ Dependency Issues (Yellow Light)

### 1. Homebrew Installation Fails (macOS)
**Symptom:**
Connection timeout or SSL error during Homebrew install.
**Solution:**
- Check your internet connection.
- If you are behind a corporate proxy, set `ALL_PROXY` environment variable.
- Try installing manually from [brew.sh](https://brew.sh).

### 2. Python Version Mismatch
**Symptom:**
`python3.11` not found, falls back to system python.
**Impact:**
Some Antigravity agents utilize specific 3.11 features.
**Solution:**
- **macOS:** `brew install python@3.11`
- **Ubuntu:** `sudo apt install python3.11 python3.11-venv`

### 3. Proxy "Address already in use"
**Symptom:**
When starting the proxy later, it fails binding to port 8080.
**Solution:**
Find and kill the process occupying the port:
```bash
lsof -i :8080
kill -9 <PID>
```

## 🐧 Linux Specifics

### Supported Distros
- Ubuntu 20.04+ (LTS recommended)
- Debian 11+
- CentOS Stream 9 / Fedora

### "sudo: command not found"
**Context:** Running in a minimal container or root shell.
**Solution:** Install sudo or run script as root (remove sudo from script commands if necessary, though script assumes sudo availability for package managers).

### Package Manager Locks
**Symptom:**
`E: Could not get lock /var/lib/dpkg/lock-frontend`
**Solution:**
Another update process is running. Wait for it to finish or reboot.

## 🔄 Rollback / Uninstall

If you need to revert changes made by the script:

1. **Remove Packages (Caution):**
   ```bash
   # macOS
   brew uninstall git node python@3.11 ffmpeg jq wget

   # Ubuntu
   sudo apt remove git nodejs npm ffmpeg jq wget
   ```
2. **Remove Proxy:**
   ```bash
   npm uninstall -g antigravity-claude-proxy
   ```
3. **Clean Environment Variables:**
   Edit `~/.zshrc` or `~/.bashrc` and remove the `GEMINI_API_KEY` export line.

## 📞 Support

If issues persist:
1. Run `check_health` manually to verify components.
2. Check `logs/setup.log` (if you piped output).
3. Contact the **Agency Ops** team.
