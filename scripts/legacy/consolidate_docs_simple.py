#!/usr/bin/env python3
"""
Documentation Consolidation - Simple Version
"""

import shutil
from pathlib import Path


def consolidate_docs():
    """Consolidate documentation systems"""
    project_root = Path("/Users/macbookprom1/mekong-cli")
    docs_dir = project_root / "docs"
    claude_dir = project_root / ".claude"
    
    print("🔄 Consolidating documentation...")
    
    # Create standards directory
    standards_dir = docs_dir / "standards"
    standards_dir.mkdir(exist_ok=True)
    
    # Copy Claude rules
    claude_rules = claude_dir / "rules"
    if claude_rules.exists():
        for rule_file in claude_rules.glob("*.md"):
            dest = standards_dir / f"claude-{rule_file.name}"
            shutil.copy2(rule_file, dest)
            print(f"✓ Copied {rule_file.name}")
    
    # Create workflows directory
    workflows_dir = docs_dir / "workflows"
    workflows_dir.mkdir(exist_ok=True)
    
    # Copy Claude workflows
    claude_workflows = claude_dir / "workflows"
    if claude_workflows.exists():
        for workflow_file in claude_workflows.glob("*.md"):
            shutil.copy2(workflow_file, workflows_dir)
            print(f"✓ Copied {workflow_file.name}")
    
    # Create integrated standards
    integrated_content = """# Integrated Development Standards

This document consolidates .claude and VIBE development standards.

## Core Principles (VIBE)

### The Trinity
1. **YAGNI** (You Aren't Gonna Need It): Không code thừa
2. **KISS** (Keep It Simple, Stupid): Đơn giản nhất có thể  
3. **DRY** (Don't Repeat Yourself): Không lặp lại

### VIBE Workflow Process
1. **Detection**: Xác định kế hoạch
2. **Analysis**: Phân tích task
3. **Implementation**: Viết code
4. **Testing**: Chạy tests (100% pass required)
5. **Review**: Tự đánh giá
6. **Finalize**: Commit và update docs

## File Standards
- Naming: `kebab-case` (e.g., `revenue-engine.py`)
- Max lines: 250 lines per file
- Plans: Located in `plans/{date}-{slug}/`
- Commits: Conventional commits format

## Security & Privacy
- Never commit secrets, API keys, passwords
- Use mock data for testing
- Follow security best practices

## Integration Compliance
1. Both systems must recognize the same standards
2. Documentation must stay synchronized
3. Workflows must be compatible
4. Quality gates must be enforced

---

🏯 Victory comes from preparation
"""
    
    integrated_path = standards_dir / "integrated-standards.md"
    integrated_path.write_text(integrated_content)
    print("✓ Created integrated standards")
    
    # Create documentation index
    index_content = """# AgencyOS Documentation Index

## 📚 Documentation Structure

### 🎯 Standards & Guidelines
- [Integrated Standards](./standards/integrated-standards.md)
- [VIBE Development Standards](./standards/vibe-development-standards.md)
- [Claude Standards](./standards/claude-standards.md)

### 🔄 Workflows  
- [Workflows Index](./workflows/README.md)
- [Primary Workflow](./workflows/primary-workflow.md)
- [Development Rules](./workflows/development-rules.md)

### 📖 Project Documentation
- [Project Overview](./project-overview-pdr.md)
- [Code Standards](./code-standards.md)
- [System Architecture](./system-architecture.md)
- [Design Guidelines](./design-guidelines.md)
- [Deployment Guide](./deployment-guide.md)
- [Project Roadmap](./project-roadmap.md)

### 🔧 Reference
- [Skills Registry](../.claude-skills/README.md)

## 🚀 Quick Start

1. **New to AgencyOS?** Start with Project Overview
2. **Ready to code?** Read Integrated Standards  
3. **Need guidance?** Check Workflows Index

---

*Documentation managed by unified documentation manager*
"""
    
    index_path = docs_dir / "README.md"
    index_path.write_text(index_content)
    print("✓ Created documentation index")
    
    print("✅ Documentation consolidation complete!")
    return True

if __name__ == "__main__":
    consolidate_docs()