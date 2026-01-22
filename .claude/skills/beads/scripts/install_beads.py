#!/usr/bin/env python3
"""
Install beads (bd) binary for ClaudeKit integration.

Attempts multiple installation methods:
1. npm (recommended for Claude Code environments)
2. curl script (macOS/Linux)
3. go install (if Go is available)
"""

import subprocess
import sys
import shutil
import os
import platform

def run_command(cmd: list[str], check: bool = True) -> tuple[bool, str]:
    """Run command and return (success, output)."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=check
        )
        return True, result.stdout + result.stderr
    except subprocess.CalledProcessError as e:
        return False, e.stdout + e.stderr
    except FileNotFoundError:
        return False, f"Command not found: {cmd[0]}"

def check_bd_installed() -> bool:
    """Check if bd is already installed and accessible."""
    return shutil.which("bd") is not None

def get_bd_version() -> str | None:
    """Get installed bd version."""
    success, output = run_command(["bd", "version"], check=False)
    if success:
        return output.strip().split("\n")[0]
    return None

def install_via_npm() -> bool:
    """Install via npm (recommended for most environments)."""
    print("📦 Attempting npm install...")

    if not shutil.which("npm"):
        print("   ⚠️  npm not found, skipping")
        return False

    success, output = run_command(["npm", "install", "-g", "@beads/bd"])
    if success:
        print("   ✅ Installed via npm")
        return True
    else:
        print(f"   ❌ npm install failed: {output[:200]}")
        return False

def install_via_curl() -> bool:
    """Install via curl script (macOS/Linux only)."""
    if platform.system() == "Windows":
        print("   ⚠️  curl install not supported on Windows")
        return False

    print("📦 Attempting curl install...")

    if not shutil.which("curl"):
        print("   ⚠️  curl not found, skipping")
        return False

    # Download and run install script
    success, output = run_command([
        "bash", "-c",
        "curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash"
    ])

    if success:
        print("   ✅ Installed via curl")
        return True
    else:
        print(f"   ❌ curl install failed: {output[:200]}")
        return False

def install_via_go() -> bool:
    """Install via go install."""
    print("📦 Attempting go install...")

    if not shutil.which("go"):
        print("   ⚠️  go not found, skipping")
        return False

    success, output = run_command([
        "go", "install", "github.com/steveyegge/beads/cmd/bd@latest"
    ])

    if success:
        # Add GOPATH/bin to PATH hint
        gopath = os.environ.get("GOPATH", os.path.expanduser("~/go"))
        print(f"   ✅ Installed via go install")
        print(f"   ℹ️  Ensure {gopath}/bin is in your PATH")
        return True
    else:
        print(f"   ❌ go install failed: {output[:200]}")
        return False

def install_via_homebrew() -> bool:
    """Install via Homebrew (macOS/Linux)."""
    print("📦 Attempting homebrew install...")

    if not shutil.which("brew"):
        print("   ⚠️  brew not found, skipping")
        return False

    # First tap the repo
    success, _ = run_command(["brew", "tap", "steveyegge/beads"], check=False)
    if not success:
        print("   ⚠️  Failed to tap steveyegge/beads")

    success, output = run_command(["brew", "install", "bd"])
    if success:
        print("   ✅ Installed via homebrew")
        return True
    else:
        print(f"   ❌ homebrew install failed: {output[:200]}")
        return False

def main():
    print("=" * 50)
    print("beads (bd) Installation Script")
    print("=" * 50)
    print()

    # Check if already installed
    if check_bd_installed():
        version = get_bd_version()
        print(f"✅ beads is already installed: {version}")
        print()
        print("To verify installation:")
        print("  bd version")
        print()
        print("To initialize in a project:")
        print("  bd init")
        return 0

    print("beads (bd) not found in PATH")
    print()

    # Try installation methods in order
    methods = [
        ("npm", install_via_npm),
        ("curl", install_via_curl),
        ("homebrew", install_via_homebrew),
        ("go", install_via_go),
    ]

    for name, method in methods:
        print()
        if method():
            print()
            print("=" * 50)
            print("✅ Installation successful!")
            print("=" * 50)
            print()

            # Verify installation
            # Need to refresh PATH for newly installed binary
            if check_bd_installed():
                version = get_bd_version()
                print(f"Installed version: {version}")
            else:
                print("⚠️  bd installed but not in current PATH")
                print("   You may need to restart your shell or add to PATH")

            print()
            print("Next steps:")
            print("  1. Navigate to your project directory")
            print("  2. Run: bd init")
            print("  3. Start tracking work: bd create 'My first issue' -p 1")
            return 0

    # All methods failed
    print()
    print("=" * 50)
    print("❌ All installation methods failed")
    print("=" * 50)
    print()
    print("Manual installation options:")
    print()
    print("1. npm (requires Node.js):")
    print("   npm install -g @beads/bd")
    print()
    print("2. curl (macOS/Linux):")
    print("   curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash")
    print()
    print("3. Homebrew (macOS):")
    print("   brew tap steveyegge/beads && brew install bd")
    print()
    print("4. Go install (requires Go 1.24+):")
    print("   go install github.com/steveyegge/beads/cmd/bd@latest")
    print()
    print("5. Build from source:")
    print("   git clone https://github.com/steveyegge/beads.git")
    print("   cd beads && go build -o bd ./cmd/bd")
    print()
    return 1

if __name__ == "__main__":
    sys.exit(main())
