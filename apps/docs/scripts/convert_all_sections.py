#!/usr/bin/env python3
"""
Batch convert ALL doc sections to IDE-executable format.
"""

import os
import re
from pathlib import Path

# All sections to convert
SECTIONS = [
    "/Users/macbookprom1/Documents/mekong-hq/mekong-cli/mekong-docs/src/content/docs/getting-started",
    "/Users/macbookprom1/Documents/mekong-hq/mekong-cli/mekong-docs/src/content/docs/mekong",
    "/Users/macbookprom1/Documents/mekong-hq/mekong-cli/mekong-docs/src/content/docs/support",
    "/Users/macbookprom1/Documents/mekong-hq/mekong-cli/mekong-docs/src/content/docs/tools",
    "/Users/macbookprom1/Documents/mekong-hq/mekong-cli/mekong-docs/src/content/docs/antigravity",
    "/Users/macbookprom1/Documents/mekong-hq/mekong-cli/mekong-docs/src/content/docs/changelog",
]

def add_ide_block(content: str, url_path: str) -> str:
    """Add IDE-executable block after frontmatter if not present."""
    
    # Skip if already has Quick Execute
    if "Quick Execute" in content or "ai_executable: true" in content:
        return None
    
    # Find frontmatter end
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            frontmatter = parts[1]
            body = parts[2]
            
            # Add ai_executable to frontmatter
            new_frontmatter = frontmatter.rstrip() + "\nai_executable: true\n"
            
            # Find title in body
            title_match = re.search(r'^#\s+(.+)$', body, re.MULTILINE)
            if title_match:
                title_end = title_match.end()
                
                # Insert Quick Execute block after title
                quick_execute = f"""

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network{url_path}
```

"""
                new_body = body[:title_end] + quick_execute + body[title_end:]
                return "---" + new_frontmatter + "---" + new_body
    
    return None

def process_directory(base_dir: str, url_prefix: str):
    """Process all .md files in directory recursively."""
    
    converted = 0
    skipped = 0
    
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith(".md"):
                filepath = Path(root) / file
                
                # Build URL path from base
                rel_path = str(filepath.relative_to(Path(base_dir).parent))
                url_path = f"/docs/{rel_path}".replace(".md", "").replace("/index", "")
                
                # Read file
                with open(filepath, "r") as f:
                    content = f.read()
                
                # Try to convert
                new_content = add_ide_block(content, url_path)
                
                if new_content:
                    with open(filepath, "w") as f:
                        f.write(new_content)
                    print(f"✅ {rel_path}")
                    converted += 1
                else:
                    skipped += 1
    
    return converted, skipped

if __name__ == "__main__":
    print("🔄 Converting remaining sections to IDE-executable format...")
    print()
    
    total_converted = 0
    total_skipped = 0
    
    for section in SECTIONS:
        if os.path.exists(section):
            print(f"📁 {section.split('/')[-1]}/")
            c, s = process_directory(section, "/docs")
            total_converted += c
            total_skipped += s
    
    print()
    print(f"✅ Converted: {total_converted}")
    print(f"⏭️  Skipped: {total_skipped}")
