---
description: List top-tier architecture references for agents
---

# 🏗️ Architecture Library

Displays the curated list of architecture repositories to "inject" into the AI context.

## Usage

```bash
/arch list
/arch structure <type>
```

## Implementation

```python
import sys
import os

def run():
    print("\n🏗️  AGENCY OS - ARCHITECTURE LIBRARY")
    print("═" * 60)
    
    # In a real scenario, this would read from docs/architecture/top-tier-repos.md
    repos = [
        {"name": "Domain-Driven Hexagon", "auth": "Sairyss", "use": "Complex Backend"},
        {"name": "Clean Arch Next.js", "auth": "Melzar", "use": "Fullstack App"},
        {"name": "DDD-CQRS-ES", "auth": "bitloops", "use": "Microservices"},
        {"name": "TypeScript DDD", "auth": "CodelyTV", "use": "Learning/Standard"},
        {"name": "Node API Boilerplate", "auth": "talyssonoc", "use": "Simple REST"},
    ]
    
    print(f"{ 'REPOSITORY':<30} | { 'AUTHOR':<15} | { 'BEST FOR'}")
    print("─" * 60)
    
    for repo in repos:
        print(f"{repo['name']:<30} | {repo['auth']:<15} | {repo['use']}")
        
    print("\n💡 TIP: Ask the agent 'Use [Repo Name] pattern to build feature X'")

if __name__ == "__main__":
    run()
```

```