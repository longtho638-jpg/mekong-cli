#!/usr/bin/env python3
"""
Documentation Consolidation
Hợp nhất .claude documentation standards với mekong-cli docs
"""

import os
import json
import shutil
from pathlib import Path
from typing import Dict, List, Set

class DocumentationConsolidator:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.docs_dir = self.project_root / "docs"
        self.claude_dir = self.project_root / ".claude"
        self.agencyos_dir = self.project_root / ".agencyos"
        
        # Documentation standards
        self.doc_standards = {
            "claude": {
                "rules_dir": self.claude_dir / "rules",
                "workflows_dir": self.claude_dir / "workflows",
                "standards_file": self.claude_dir / "CLAUDE.md"
            },
            "mekong": {
                "docs_dir": self.docs_dir,
                "project_docs": [
                    "project-overview-pdr.md",
                    "code-standards.md", 
                    "codebase-summary.md",
                    "design-guidelines.md",
                    "deployment-guide.md",
                    "system-architecture.md",
                    "project-roadmap.md"
                ]
            }
        }
        
    def create_unified_docs_structure(self):
        """Tạo cấu trúc documents hợp nhất"""
        unified_dirs = [
            "standards",
            "workflows", 
            "guides",
            "reference",
            "api",
            "tutorials"
        ]
        
        for dir_name in unified_dirs:
            (self.docs_dir / dir_name).mkdir(parents=True, exist_ok=True)
            
    def consolidate_claude_rules(self):
        """Hợp nhất .claude rules vào docs/standards"""
        standards_dir = self.docs_dir / "standards"
        
        # Copy Claude rules
        claude_rules_dir = self.claude_dir / "rules"
        if claude_rules_dir.exists():
            for rule_file in claude_rules_dir.glob("*.md"):
                dest = standards_dir / f"claude-{rule_file.name}"
                shutil.copy2(rule_file, dest)
                
        # Copy VIBE development rules
        development_rules = claude_rules_dir / "development-rules.md"
        if development_rules.exists():
            shutil.copy2(development_rules, standards_dir / "vibe-development-standards.md")
            
    def consolidate_workflows(self):
        """Hợp nhất workflows"""
        workflows_dir = self.docs_dir / "workflows"
        
        # Copy Claude workflows
        claude_workflows_dir = self.claude_dir / "workflows"
        if claude_workflows_dir.exists():
            for workflow_file in claude_workflows_dir.glob("*.md"):
                shutil.copy2(workflow_file, workflows_dir)
                
        # Create workflow index
        self.create_workflow_index(workflows_dir)
        
    def create_workflow_index(self, workflows_dir: Path):
        """Tạo workflow index"""
        workflows = list(workflows_dir.glob("*.md"))
        
        index_content = """# Workflows Index

This directory contains all available workflows for the .claude and AgencyOS integration.

## Available Workflows

"""
        
        for workflow in sorted(workflows):
            workflow_name = workflow.stem.replace("-", " ").title()
            index_content += f"- [{workflow_name}](./{workflow.name})\\n"
            
        index_content += """
## Usage

Workflows are automatically loaded by Claude agents and provide step-by-step guidance for:

- Feature implementation
- Code review processes  
- Testing procedures
- Deployment workflows
- Documentation updates
- Debugging procedures

## Workflow Categories

### Core Workflows
- **Primary Workflow**: Main development workflow for all tasks
- **Development Rules**: VIBE coding standards and principles

### Specialized Workflows  
- **Testing Workflow**: Comprehensive testing procedures
- **Code Review Workflow**: Code review and quality assurance
- **Deployment Workflow**: Production deployment procedures
- **Documentation Workflow**: Documentation management

See individual workflow files for detailed instructions.
"""
        
        index_path = workflows_dir / "README.md"
        index_path.write_text(index_content)
        
    def create_integrated_standards(self):
        """Tạo integrated standards document"""
        standards_dir = self.docs_dir / "standards"
        
        integrated_content = """# Integrated Development Standards

This document consolidates .claude and VIBE development standards for seamless integration.

## Overview

The AgencyOS project follows two complementary sets of standards:

1. **Claude Standards**: Agent coordination and workflow management
2. **VIBE Standards**: Vietnamese-first development principles

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

| Rule | Standard |
|------|----------|
| Naming | `kebab-case` (e.g., `revenue-engine.py`) |
| Max lines | 250 lines per file |
| Plans | Located in `plans/{date}-{slug}/` |
| Commits | Conventional commits format |

## Security & Privacy

- **Never commit** secrets, API keys, passwords
- Respect `privacy-block.cjs` restrictions  
- Use mock data for testing
- Follow security best practices

## Agent Coordination (.claude)

### Workflow Management
- Primary workflow for all tasks
- Specialized workflows for specific domains
- Agent delegation patterns
- Context management protocols

### Documentation Management
- Keep docs in `./docs` folder
- Auto-sync with .claude standards
- Maintain both system's compliance

## Quality Assurance

### Testing Requirements
- **100% test pass rate mandatory**
- No fake data or temporary solutions
- Comprehensive coverage for edge cases
- Performance validation

### Code Review Process
- Delegate to code-reviewer agent
- Follow coding standards strictly
- Optimize for maintainability
- Document complex logic

## Implementation Guidelines

### When Implementing Features
1. Create implementation plan first
2. Follow architectural patterns
3. Handle error scenarios
4. Write clean, readable code
5. Run tests before committing

### When Managing Documentation
1. Update relevant docs immediately
2. Maintain consistency across systems
3. Use Vietnamese-first approach where appropriate
4. Follow markdown standards

## Integration Compliance

To ensure seamless .claude and mekong-cli integration:

1. **Both systems must recognize the same standards**
2. **Documentation must stay synchronized**  
3. **Workflows must be compatible**
4. **Quality gates must be enforced**

---

🏯 **"Thắng từ trong chuẩn bị"** - Victory comes from preparation
"""
        
        integrated_path = standards_dir / "integrated-standards.md"
        integrated_path.write_text(integrated_content)
        
    def create_documentation_manager(self):
        """Tạo documentation manager"""
        manager_content = '''#!/usr/bin/env python3
"""
Unified Documentation Manager
Quản lý tài liệu hợp nhất cho .claude và mekong-cli
"""

import os
import json
import time
from pathlib import Path
from typing import Dict, List, Set
from datetime import datetime

class DocumentationManager:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.docs_dir = self.project_root / "docs"
        self.claude_dir = self.project_root / ".claude"
        self.sync_file = self.docs_dir / ".sync_status.json"
        
        # Documentation sources
        self.sources = {
            "claude_rules": self.claude_dir / "rules",
            "claude_workflows": self.claude_dir / "workflows", 
            "project_docs": self.docs_dir,
            "skills_docs": self.project_root / ".claude-skills"
        }
        
    def get_sync_status(self) -> Dict[str, Any]:
        """Get current sync status"""
        if self.sync_file.exists():
            return json.loads(self.sync_file.read_text())
        return {"last_sync": None, "synced_files": []}
        
    def update_sync_status(self, synced_files: List[str]):
        """Update sync status"""
        status = {
            "last_sync": datetime.now().isoformat(),
            "synced_files": synced_files
        }
        self.sync_file.write_text(json.dumps(status, indent=2))
        
    def scan_changes(self) -> Dict[str, List[str]]:
        """Scan for changes in documentation sources"""
        changes = {
            "added": [],
            "modified": [],
            "deleted": []
        }
        
        last_sync = self.get_sync_status().get("last_sync")
        
        if not last_sync:
            # First sync - get all files
            for source_name, source_path in self.sources.items():
                if source_path.exists():
                    for file_path in source_path.rglob("*.md"):
                        changes["added"].append(str(file_path))
        else:
            # Check for changes since last sync
            sync_time = datetime.fromisoformat(last_sync).timestamp()
            
            for source_name, source_path in self.sources.items():
                if source_path.exists():
                    for file_path in source_path.rglob("*.md"):
                        file_mtime = file_path.stat().st_mtime
                        if file_mtime > sync_time:
                            changes["modified"].append(str(file_path))
                            
        return changes
        
    def sync_documentation(self) -> Dict[str, Any]:
        """Sync documentation between systems"""
        changes = self.scan_changes()
        synced_files = []
        
        # Process changes
        for change_type, files in changes.items():
            for file_path in files:
                if self.sync_file(file_path, change_type):
                    synced_files.append(file_path)
                    
        # Update sync status
        self.update_sync_status(synced_files)
        
        return {
            "status": "success",
            "changes": changes,
            "synced_files": synced_files,
            "timestamp": datetime.now().isoformat()
        }
        
    def sync_file(self, file_path: str, change_type: str) -> bool:
        """Sync individual file"""
        source_path = Path(file_path)
        
        # Determine destination based on source
        if "claude/rules" in file_path:
            dest = self.docs_dir / "standards" / f"claude-{source_path.name}"
        elif "claude/workflows" in file_path:
            dest = self.docs_dir / "workflows" / source_path.name
        elif "claude-skills" in file_path:
            # Skills docs stay in place
            return True
        else:
            # Project docs stay in place
            return True
            
        try:
            if change_type == "deleted":
                if dest.exists():
                    dest.unlink()
            else:
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_path, dest)
            return True
        except Exception as e:
            print(f"Error syncing {file_path}: {e}")
            return False
            
    def validate_documentation(self) -> Dict[str, Any]:
        """Validate documentation consistency"""
        issues = []
        
        # Check for required files
        required_files = [
            "standards/integrated-standards.md",
            "workflows/README.md", 
            "project-overview-pdr.md",
            "code-standards.md"
        ]
        
        for req_file in required_files:
            if not (self.docs_dir / req_file).exists():
                issues.append(f"Missing required file: {req_file}")
                
        # Check for broken links
        for doc_file in self.docs_dir.rglob("*.md"):
            # Simple check for internal links
            content = doc_file.read_text(encoding='utf-8')
            import re
            links = re.findall(r'\\[([^\\]]+)\\]\\(([^)]+)\\)', content)
            
            for link_text, link_target in links:
                if link_target.startswith('./'):
                    target_path = doc_file.parent / link_target[2:]
                    if not target_path.exists():
                        issues.append(f"Broken link in {doc_file.name}: {link_target}")
                        
        return {
            "status": "valid" if not issues else "invalid",
            "issues": issues,
            "checked_files": len(list(self.docs_dir.rglob("*.md")))
        }
        
    def generate_docs_index(self) -> str:
        """Generate comprehensive documentation index"""
        index_content = """# AgencyOS Documentation Index

Complete documentation hub for .claude and mekong-cli integration.

## 📚 Documentation Structure

### 🎯 Standards & Guidelines
- [Integrated Standards](./standards/integrated-standards.md) - Complete development standards
- [VIBE Development Standards](./standards/vibe-development-standards.md) - Vietnamese-first principles
- [Claude Standards](./standards/claude-standards.md) - Agent coordination standards

### 🔄 Workflows  
- [Workflows Index](./workflows/README.md) - Available workflows
- [Primary Workflow](./workflows/primary-workflow.md) - Main development workflow
- [Development Rules](./workflows/development-rules.md) - Coding standards

### 📖 Project Documentation
- [Project Overview](./project-overview-pdr.md) - Project architecture and goals
- [Code Standards](./code-standards.md) - Coding conventions and best practices
- [System Architecture](./system-architecture.md) - Technical architecture
- [Design Guidelines](./design-guidelines.md) - Design principles and patterns
- [Deployment Guide](./deployment-guide.md) - Deployment procedures
- [Project Roadmap](./project-roadmap.md) - Development roadmap

### 🔧 Reference
- [Skills Registry](../.claude-skills/README.md) - Available skills
- [API Documentation](./api/) - API references
- [Tutorials](./tutorials/) - Step-by-step tutorials

## 🚀 Quick Start

1. **New to AgencyOS?** Start with [Project Overview](./project-overview-pdr.md)
2. **Ready to code?** Read [Integrated Standards](./standards/integrated-standards.md)  
3. **Need guidance?** Check [Workflows Index](./workflows/README.md)

## 🔄 Keeping Docs Updated

Documentation is automatically synchronized between .claude and mekong-cli systems.
Last sync: """ + str(self.get_sync_status().get("last_sync", "Never")) + """

## 📖 Navigation

Use the sidebar navigation or search functionality to find specific documentation.
All documentation follows markdown format and includes Vietnamese translations where appropriate.

---

*Documentation managed by unified documentation manager*
"""
        
        return index_content
        
    def run_sync(self):
        """Run documentation synchronization"""
        print("🔄 Starting documentation synchronization...")
        
        # Sync documentation
        sync_result = self.sync_documentation()
        
        # Validate documentation
        validation_result = self.validate_documentation()
        
        # Generate index
        index_content = self.generate_docs_index()
        index_path = self.docs_dir / "README.md"
        index_path.write_text(index_content)
        
        print("✅ Documentation synchronization complete!")
        
        return {
            "sync": sync_result,
            "validation": validation_result,
            "index_updated": True
        }

if __name__ == "__main__":
    project_root = "/Users/macbookprom1/mekong-cli"
    doc_manager = DocumentationManager(project_root)
    result = doc_manager.run_sync()
    
    print(f"\n📊 Summary:")
    print(f"- Synced files: {len(result['sync']['synced_files'])}")
    print(f"- Validation: {result['validation']['status']}")
    print(f"- Issues found: {len(result['validation']['issues'])}")