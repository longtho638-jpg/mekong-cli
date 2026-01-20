# Tactical Pattern 10: Agent Delegation

> **The Digital Army**

## Context
Executing complex tasks.

## Pattern
1. **Decompose**: Break task into sub-tasks.
2. **Assign**:
   - Strategy -> `binh-phap-strategist`
   - Code -> `coding-server`
   - Marketing -> `marketing-server`
   - Ops -> `agency-server`
3. **Orchestrate**: Use `commander_server` or Main Agent to coordinate.
4. **Verify**: Check outputs against requirements.

## Goal
Efficient execution using specialized agents.
