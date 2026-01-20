# Tactical Pattern 05: Auto-Accept Velocity

> **Speed over Permission**

## Context
Daily development workflow.

## Pattern
1. **Default**: Run standard commands (`ls`, `cat`, `test`, `build`) without asking.
2. **Exception**: Stop only for destructive acts (`rm`, `push`, `deploy`).
3. **Override**: If user says "Just do it", switch to fully autonomous mode for that session.

## Benefit
Reduces friction, increases velocity (Quân Tranh - Speed).
