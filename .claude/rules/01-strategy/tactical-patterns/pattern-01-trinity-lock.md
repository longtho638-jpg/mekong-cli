# Tactical Pattern 01: The Trinity Lock

> **Win-Win-Win Validation Protocol**

## Context
Use when making ANY strategic decision or signing a deal.

## Pattern
1. **Trigger**: New deal / Feature / Hire / Pivot.
2. **Action**: Run `win3-checker` agent.
3. **Check**:
   - 👑 Owner: Equity/Cash/Legacy?
   - 🏢 Agency: Asset/Reputation?
   - 🚀 Client: Growth/Protection?
4. **Resolution**:
   - If 3/3 Win -> **GO**
   - If <3 Win -> **STOP & RENEGOTIATE**

## Code Ref
`antigravity/mcp_servers/agency_server/handlers.py` -> `validate_win()`
