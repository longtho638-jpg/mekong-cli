# Antigravity Scripts 🏯

This directory contains the automation scripts for the Antigravity Onboarding Kit.

## Scripts

### 1. `antigravity-wizard.py` (The Wizard)
An interactive CLI tool that acts as your personal "Strategist" (Quân Sư).
- **Features:** Hardware check, Network speedtest, Auto-installation guide.
- **Usage:** `python3 antigravity-wizard.py`

### 2. `setup-antigravity.sh` (The Bootloader)
The heavy-lifter that installs all necessary dependencies.
- **Installs:** Homebrew, Node.js, Python, Git, VSCode extensions.
- **Usage:** `./setup-antigravity.sh`

## Prerequisites

- Python 3.8+
- macOS (Recommended) or Linux

## Dependencies

Install the required Python packages:

```bash
pip install -r ../../../requirements.txt
```
(Mainly `rich`, `questionary`, `psutil`, `speedtest-cli`)
