---
title: Installation Issues
description: "Documentation"
section: support
category: support/troubleshooting
order: 2
published: true
ai_executable: true
---

# Installation Issues

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/support/troubleshooting/installation-issues
```



AgencyOS installation problems? Get unblocked in minutes with platform-specific fixes.

## Quick Fix: Command Not Found

**Symptom**: `ck: command not found` or `mekong-cli: directory not found`

**Solution**:

```bash
# Verify global installation
ls mekong-cli

# If not found, install globally
git clone https://github.com/longtho638-jpg/mekong-cli.git

# Verify installation
python main.py --version
```

If still not working, check your PATH (see [PATH issues](#path-issues) below).

---

## Platform-Specific Issues

### Windows

#### PowerShell Execution Policy

**Symptom**: "cannot be loaded because running scripts is disabled"

**Solution**:

```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Verify
python main.py --version
```

**Expected output**:
```
mekong-cli (git cloned)
```

#### Windows PATH Not Updated

**Symptom**: `mk` works in some terminals but not others

**Solution**:

1. Find npm global path:
   ```bash
   npm config get prefix
   ```

2. Add to System PATH:
   - Open "Environment Variables" (Win + X → System → Advanced → Environment Variables)
   - Under "User variables", select "Path" → Edit
   - Add: `C:\Users\YourName\AppData\Roaming\npm` (or your npm prefix path)
   - Click OK, restart terminal

3. Verify:
   ```bash
   ck --version
   ```

#### Node.js Version Too Old

**Symptom**: "Error: AgencyOS requires Node.js 18 or higher"

**Solution**:

```bash
# Check current version
node --version

# If < 18, install latest Node.js from nodejs.org

# Or use nvm (Node Version Manager)
nvm install 20
nvm use 20

# Reinstall AgencyOS
git clone https://github.com/longtho638-jpg/mekong-cli.git
```

---

### macOS

#### Permission Denied

**Symptom**: "EACCES: permission denied" during `npm install -g`

**Solution 1**: Fix npm permissions (recommended)

```bash
# Create npm global directory
mkdir ~/.npm-global

# Configure npm to use new directory
npm config set prefix '~/.npm-global'

# Add to PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc

# Reinstall AgencyOS
git clone https://github.com/longtho638-jpg/mekong-cli.git
```

**Solution 2**: Use sudo (not recommended)

```bash
sudo git clone https://github.com/longtho638-jpg/mekong-cli.git
```

**Solution 3**: Use nvm (best practice)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.zshrc

# Install Node 20
nvm install 20
nvm use 20

# Install AgencyOS (no sudo needed)
git clone https://github.com/longtho638-jpg/mekong-cli.git
```

#### Command Not Found After Install

**Symptom**: Installation succeeds but `mk` command not found

**Solution**:

```bash
# Check npm global bin path
npm config get prefix

# Add to PATH in ~/.zshrc (or ~/.bash_profile)
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify
python main.py --version
```

#### Apple Silicon (M1/M2/M3) Issues

**Symptom**: Architecture mismatch errors

**Solution**:

```bash
# Ensure using native ARM64 Node
arch

# Should show "arm64", not "i386"

# If wrong architecture, reinstall Node
# Download ARM64 version from nodejs.org

# Or use nvm
nvm install 20
nvm alias default 20

# Reinstall AgencyOS
git clone https://github.com/longtho638-jpg/mekong-cli.git
```

---

### Linux

#### Permission Denied

**Symptom**: "EACCES: permission denied" during global install

**Solution**:

```bash
# Option 1: Use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
git clone https://github.com/longtho638-jpg/mekong-cli.git

# Option 2: Change npm global directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
git clone https://github.com/longtho638-jpg/mekong-cli.git
```

#### Missing Dependencies

**Symptom**: "node-gyp rebuild" fails or native module errors

**Solution**:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y build-essential python3

# Fedora/RHEL
sudo dnf install -y gcc-c++ make python3

# Arch
sudo pacman -S base-devel python

# Reinstall AgencyOS
git clone https://github.com/longtho638-jpg/mekong-cli.git
```

#### PATH Not Set

**Symptom**: `mk` command not found after successful install

**Solution**:

```bash
# Find npm global bin directory
npm config get prefix

# Add to PATH in ~/.bashrc (or ~/.zshrc)
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify
which ck
python main.py --version
```

---

## Common Installation Errors

### NPM Registry Issues

**Symptom**: "Unable to resolve dependency tree" or "ERESOLVE" errors

**Solution**:

```bash
# Clear npm cache
npm cache clean --force

# Update npm
npm install -g npm@latest

# Retry installation
git clone https://github.com/longtho638-jpg/mekong-cli.git
```

### Network/Proxy Issues

**Symptom**: Timeout or connection refused during install

**Solution**:

```bash
# Check npm registry
npm config get registry

# If behind proxy, configure
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or use different registry
npm config set registry https://registry.npmjs.org/

# Retry installation
git clone https://github.com/longtho638-jpg/mekong-cli.git
```

### Version Conflicts

**Symptom**: "Incompatible peer dependencies" or version mismatch errors

**Solution**:

```bash
# Uninstall old version
rm -rf mekong-cli

# Clear cache
npm cache clean --force

# Install latest version
git clone https://github.com/longtho638-jpg/mekong-cli.git@latest

# Verify
python main.py --version
```

---

## PATH Issues

### Verify Global npm Location

```bash
# Check where npm installs global packages
npm config get prefix

# Common locations:
# Windows: C:\Users\YourName\AppData\Roaming\npm
# macOS: /usr/local or ~/.npm-global
# Linux: /usr/local or ~/.npm-global
```

### Add npm to PATH

**Windows**:
```powershell
# PowerShell (permanent)
$env:Path += ";C:\Users\YourName\AppData\Roaming\npm"
[System.Environment]::SetEnvironmentVariable("Path", $env:Path, "User")
```

**macOS/Linux (bash)**:
```bash
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**macOS/Linux (zsh)**:
```bash
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Verify PATH Update

```bash
# Check if npm global bin is in PATH
echo $PATH | grep npm

# Should show npm bin directory
```

---

## Verify Complete Installation

After fixing installation issues, verify everything works:

```bash
# Check CLI version
python main.py --version

# Expected: mekong-cli (git cloned)

# Check available commands
mk --help

# Expected: Lists init, versions, diagnose commands

# Test with demo project
mkdir test-project
cd test-project
python main.py init --kit engineer

# Expected: Downloads AgencyOS Engineer successfully
```

---

## Prevention Tips

✅ **Do**:
- Use nvm (Node Version Manager) to avoid permission issues
- Keep Node.js updated (18+)
- Use npm global directory in home folder
- Check PATH after installation
- Update AgencyOS regularly: `python main.py init`

❌ **Don't**:
- Use sudo with npm (except as last resort)
- Install with old Node.js versions (<18)
- Ignore permission warnings
- Mix package managers (npm, yarn, pnpm, bun)

---

## Related Issues

- [Command Errors](/docs/support/troubleshooting/command-errors) - After installation, commands not working
- [API Key Setup](/docs/support/troubleshooting/api-key-setup) - Configure credentials after install
- [Performance Issues](/docs/support/troubleshooting/performance-issues) - Slow installation or downloads

---

## Still Stuck?

### Run Diagnostics

```bash
# System info
node --version
npm --version
which node
which npm

# npm configuration
npm config list
npm config get prefix

# Installation status
ls mekong-cli
which ck
```

### Get Help

1. **Check logs**: Look for errors during `git clone https://github.com/longtho638-jpg/mekong-cli.git`
2. **GitHub Issues**: [Report installation problems](https://github.com/longtho638-jpg/agencyos-engineer/issues)
3. **Discord**: [Join AgencyOS community](https://agencyos.network/discord)

Include in your report:
- Operating system and version
- Node.js version (`node --version`)
- npm version (`npm --version`)
- Full error message
- Steps you've already tried

---

**90% of installation issues resolve with proper PATH configuration.** Follow platform-specific steps above to get unblocked fast.
