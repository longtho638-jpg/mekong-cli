#!/usr/bin/env python3
"""
🎯 Guide Command - AgencyOS CLI
=============================

User guide and onboarding.
"""

from rich.console import Console
from rich.markdown import Markdown


def main():
    """Show user guide."""
    console = Console()
    
    guide_content = """
# 🎯 AgencyOS User Guide

## 🚀 Getting Started

### 1. First Steps
```bash
agencyos guide          # Show this guide
agencyos scaffold       # Create project structure
agencyos kanban         # Open task management
```

### 2. Project Setup
```bash
agencyos scaffold "E-commerce Platform"  # Create new project
cd your-project/
agencyos cook "user authentication"     # Build features
agencyos ship                          # Deploy
```

## 📋 Core Commands

| Category | Commands | Description |
|----------|-----------|-------------|
| **Getting Started** | `guide`, `scaffold`, `kanban` | Setup and management |
| **Development** | `binh-phap`, `cook`, `ship` | Build and deploy |
| **Strategy** | `analyze`, `plan`, `report` | Analysis and planning |
| **MCP** | `setup`, `install`, `config` | Package management |

## 🏗️ Development Workflow

### 1. Analysis Phase
```bash
agencyos analyze "market research"  # Analyze requirements
```

### 2. Planning Phase  
```bash
agencyos plan "development roadmap"  # Create implementation plan
```

### 3. Implementation Phase
```bash
agencyos cook "user authentication"  # Build with AI agents
```

### 4. Testing Phase
```bash
agencyos test                      # Run automated tests
```

### 5. Deployment Phase
```bash
agencyos ship                      # Deploy to production
```

## 🎯 Best Practices

### 1. Project Structure
- Follow clean architecture principles
- Keep modules under 200 lines
- Use proper naming conventions

### 2. Development Standards
- Write tests before implementation
- Follow TypeScript best practices
- Use semantic versioning

### 3. Collaboration
- Use Kanban for task management
- Document decisions
- Review code before merging

## 🔧 Configuration

### Environment Variables
```bash
export OPENAI_API_KEY="your-key"
export BRAINTREE_ENV="sandbox"
export ALLOWED_ORIGINS="http://localhost:3000"
```

### Project Configuration
```json
{
  "name": "your-project",
  "version": "1.0.0",
  "license": "pro",
  "features": ["auth", "billing", "dashboard"]
}
```

## 📞 Support

- **Documentation**: [agencyos.network/docs](https://agencyos.network/docs)
- **Community**: [Discord Server](https://discord.gg/agencyos)
- **Issues**: [GitHub Issues](https://github.com/agencyos/issues)

---

*"Không đánh mà thắng" - Win Without Fighting 🏯*
    """
    
    console.print(Markdown(guide_content))

if __name__ == "__main__":
    main()