from pathlib import Path
from typing import Dict
from rich.console import Console

console = Console()

def update_file_placeholders(file_path: Path, replacements: Dict[str, str]) -> bool:
    """Updates placeholders in a file with provided values."""
    if not file_path.exists():
        return False
    
    try:
        content = file_path.read_text(encoding="utf-8")
        for key, value in replacements.items():
            content = content.replace(f"{{{{ {key} }}}}", value)
        file_path.write_text(content, encoding="utf-8")
        return True
    except Exception as e:
        console.print(f"[red]Failed to update {file_path.name}:[/red] {e}")
        return False
