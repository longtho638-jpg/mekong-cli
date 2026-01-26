# Setup Guide

## Prerequisites
- Node.js 18+
- Python 3.10+
- Git

## Installation

1.  **Personalize**:
    Run the setup script to replace placeholders (`{{AGENCY_NAME}}`) with your agency details.
    ```bash
    ./setup.sh
    ```

2.  **Install Platform Dependencies**:
    The setup script should have handled this, but if not:
    ```bash
    cd platform/dashboard && npm install
    cd ../website && npm install
    ```

3.  **Configure Agents**:
    Review the agent definitions in `.claude/agents/` and ensure they align with your niche.

4.  **Start the Engine**:
    Use the Agency CLI (if installed) or standard npm commands to start your dashboard.
    ```bash
    cd platform/dashboard && npm run dev
    ```

## Customization
- Edit `.agency/config.json` to update global settings.
- Modify `10-STRATEGY/03-Offers` to define your pricing.
