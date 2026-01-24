# Antibridge

## Description
Bridge between CLI and Mobile/External agents. Allows control of the AntiBridge infrastructure.

## Implementation
- **Core Logic**: `antigravity/core/control.py` (and `antigravity/core/headless.py`)
- **CLI Command**: `mekong antibridge`

## Capabilities
- Connect to mobile agent network
- Send commands to headless instances
- Receive status updates from remote nodes

## Dependencies
- `websockets`
- `fastapi` (for receiving webhooks)
