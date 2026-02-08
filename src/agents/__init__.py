from .lead_hunter import LeadHunter
from .content_writer import ContentWriter
from .recipe_crawler import RecipeCrawler
from .git_agent import GitAgent
from .file_agent import FileAgent
from .shell_agent import ShellAgent

# Agent registry: maps short names to classes for CLI lookup
AGENT_REGISTRY = {
    "git": GitAgent,
    "file": FileAgent,
    "shell": ShellAgent,
    "lead": LeadHunter,
    "content": ContentWriter,
    "crawler": RecipeCrawler,
}

__all__ = [
    "LeadHunter",
    "ContentWriter",
    "RecipeCrawler",
    "GitAgent",
    "FileAgent",
    "ShellAgent",
    "AGENT_REGISTRY",
]
