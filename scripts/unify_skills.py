#!/usr/bin/env python3
"""
Skill System Unification
Hợp nhất hệ thống skill .claude và .agencyos thành .claude-skills
"""

import os
import shutil
import json
from pathlib import Path
from typing import Dict, List, Set

class SkillUnifier:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.claude_skills = self.project_root / ".claude/skills"
        self.agencyos_skills = self.project_root / ".agencyos/skills"
        self.unified_skills = self.project_root / ".claude-skills"
        
        # Unified skill structure
        self.skill_structure = {
            "SKILL.md": "Skill definition for Claude",
            "implementation.py": "Python implementation (optional)",
            "package.json": "Node.js implementation (optional)", 
            "requirements.txt": "Python dependencies (optional)",
            "tests/": "Test files",
            "docs/": "Documentation",
            "scripts/": "Utility scripts",
            "references/": "Reference materials"
        }
        
        self.skill_registry = {}
        
    def create_unified_directory(self):
        """Tạo directory .claude-skills"""
        if not self.unified_skills.exists():
            self.unified_skills.mkdir(parents=True)
            
    def get_all_skills(self) -> Dict[str, Dict[str, str]]:
        """Lấy danh sách tất cả skills và source"""
        skills = {}
        
        # Lấy skills từ .claude
        if self.claude_skills.exists():
            for skill_dir in self.claude_skills.iterdir():
                if skill_dir.is_dir():
                    name = skill_dir.name
                    skills[name] = skills.get(name, {})
                    skills[name]["claude"] = str(skill_dir)
                    
        # Lấy skills từ .agencyos  
        if self.agencyos_skills.exists():
            for skill_dir in self.agencyos_skills.iterdir():
                if skill_dir.is_dir():
                    name = skill_dir.name
                    skills[name] = skills.get(name, {})
                    skills[name]["agencyos"] = str(skill_dir)
                    
        return skills
    
    def merge_skill(self, skill_name: str, sources: Dict[str, str]):
        """Hợp nhất skill từ nhiều sources"""
        skill_target = self.unified_skills / skill_name
        skill_target.mkdir(exist_ok=True)
        
        # Priority order: .agencyos > .claude (agencyos có thực tế hơn)
        source_priority = ["agencyos", "claude"]
        
        for source in source_priority:
            if source in sources:
                source_path = Path(sources[source])
                self.copy_skill_content(source_path, skill_target)
                
        # Tạo SKILL.md nếu không có
        skill_md = skill_target / "SKILL.md"
        if not skill_md.exists():
            self.create_skill_md(skill_name, skill_md)
            
        # Tạo cấu trúc folders nếu chưa có
        for folder in ["tests", "docs", "scripts", "references"]:
            (skill_target / folder).mkdir(exist_ok=True)
            
    def copy_skill_content(self, source: Path, target: Path):
        """Copy content từ source sang target"""
        for item in source.rglob("*"):
            if item.is_file():
                # Tạo relative path
                rel_path = item.relative_to(source)
                
                # Bỏ qua các file không cần thiết
                if self.should_ignore_file(rel_path):
                    continue
                    
                    dest = target / rel_path
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Merge content cho SKILL.md
                    if item.name == "SKILL.md" and dest.exists():
                        self.merge_skill_md(item, dest)
                    else:
                        shutil.copy2(item, dest)
                        
    def should_ignore_file(self, path: Path) -> bool:
        """Kiểm tra file có nên ignore không"""
        ignore_patterns = [
            "__pycache__",
            ".git",
            ".coverage",
            "node_modules",
            "*.pyc",
            ".DS_Store"
        ]
        
        path_str = str(path)
        for pattern in ignore_patterns:
            if pattern in path_str:
                return True
        return False
        
    def merge_skill_md(self, source: Path, target: Path):
        """Hợp nhất content của SKILL.md"""
        source_content = source.read_text(encoding='utf-8')
        target_content = target.read_text(encoding='utf-8')
        
        # Simple merge - add source content if not duplicate
        if source_content not in target_content:
            merged = f"{target_content}\n\n---\n\n{source_content}"
            target.write_text(merged, encoding='utf-8')
            
    def create_skill_md(self, skill_name: str, target_path: Path):
        """Tạo SKILL.md mặc định"""
        content = f"""# {skill_name.replace('-', ' ').title()}

## Description
Skill for {skill_name.replace('-', ' ')} operations.

## When to Use
Use when working with {skill_name.replace('-', ' ')} related tasks.

## Implementation
Located in implementation.py or scripts/ directory.

## Dependencies
Check requirements.txt for Python dependencies.
Check package.json for Node.js dependencies.
"""
        target_path.write_text(content, encoding='utf-8')
        
    def create_skill_registry(self):
        """Tạo skill registry"""
        all_skills = self.get_all_skills()
        
        registry = {
            "version": "1.0.0",
            "created": str(Path.cwd()),
            "skills": {}
        }
        
        for skill_name, sources in all_skills.items():
            registry["skills"][skill_name] = {
                "name": skill_name,
                "sources": sources,
                "path": f".claude-skills/{skill_name}",
                "merged": True
            }
            
        # Lưu registry
        registry_path = self.unified_skills / "registry.json"
        registry_path.write_text(json.dumps(registry, indent=2), encoding='utf-8')
        
        return registry
        
    def run(self):
        """Thực hiện unification"""
        print("🚀 Starting skill system unification...")
        
        # 1. Create unified directory
        self.create_unified_directory()
        
        # 2. Get all skills
        all_skills = self.get_all_skills()
        print(f"📊 Found {len(all_skills)} skills to unify")
        
        # 3. Merge each skill
        for skill_name, sources in all_skills.items():
            print(f"🔗 Merging skill: {skill_name}")
            self.merge_skill(skill_name, sources)
            
        # 4. Create registry
        registry = self.create_skill_registry()
        print(f"📋 Created skill registry with {len(registry['skills'])} skills")
        
        # 5. Create README
        self.create_readme()
        
        print("✅ Skill unification complete!")
        return registry
        
    def create_readme(self):
        """Tạo README cho .claude-skills"""
        readme_content = """# Claude Skills Registry

Unified skill system for .claude and AgencyOS integration.

## Structure
```
.claude-skills/
├── registry.json          # Skill registry
├── skill-name/           # Individual skill directory
│   ├── SKILL.md         # Claude skill definition
│   ├── implementation.py # Python implementation
│   ├── tests/           # Test files
│   ├── docs/            # Documentation
│   ├── scripts/         # Utility scripts
│   └── references/      # Reference materials
```

## Usage

Skills are automatically discovered by Claude agents and can be activated using:

```
/skill skill-name
```

## Development

When adding new skills:
1. Create directory under .claude-skills/
2. Add SKILL.md with proper definition
3. Add implementation files
4. Update registry.json (optional - auto-generated)
"""
        
        readme_path = self.unified_skills / "README.md"
        readme_path.write_text(readme_content, encoding='utf-8')

if __name__ == "__main__":
    project_root = "/Users/macbookprom1/mekong-cli"
    unifier = SkillUnifier(project_root)
    registry = unifier.run()
    
    print(f"\n📈 Summary:")
    print(f"- Total skills unified: {len(registry['skills'])}")
    print(f"- Registry location: .claude-skills/registry.json")