import os
import frontmatter
import markdown
from typing import List
from app.models import ChangelogEntry
from datetime import datetime

class ParserService:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir

    def parse_changelogs(self) -> List[ChangelogEntry]:
        entries = []
        if not os.path.exists(self.data_dir):
            return []

        for filename in os.listdir(self.data_dir):
            if not filename.endswith(".md"):
                continue

            filepath = os.path.join(self.data_dir, filename)
            post = frontmatter.load(filepath)

            # Convert markdown body to HTML
            html_content = markdown.markdown(post.content)

            # Parse date safely
            date_obj = post.get('date')
            if isinstance(date_obj, str):
                try:
                    date_obj = datetime.strptime(date_obj, "%Y-%m-%d").date()
                except ValueError:
                    # Fallback or skip
                    continue

            entry = ChangelogEntry(
                title=post.get('title', 'Untitled'),
                date=date_obj,
                type=post.get('type', 'general'),
                author=post.get('author'),
                content=post.content,
                content_html=html_content,
                slug=filename.replace('.md', '')
            )
            entries.append(entry)

        # Sort by date descending
        entries.sort(key=lambda x: x.date, reverse=True)
        return entries
