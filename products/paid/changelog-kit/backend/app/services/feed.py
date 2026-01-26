from typing import List
from app.models import ChangelogEntry
import email.utils

class FeedService:
    def generate_rss(self, entries: List[ChangelogEntry], base_url: str = "http://localhost:3000") -> str:
        # Simple RSS 2.0 generator
        rss_items = []

        for entry in entries:
            pub_date = email.utils.format_datetime(datetime(entry.date.year, entry.date.month, entry.date.day))
            link = f"{base_url}/changelog#{entry.slug}"

            item = f"""
            <item>
                <title>{entry.title}</title>
                <link>{link}</link>
                <guid>{link}</guid>
                <pubDate>{pub_date}</pubDate>
                <description><![CDATA[{entry.content_html}]]></description>
                <category>{entry.type}</category>
            </item>
            """
            rss_items.append(item)

        rss_feed = f"""<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
    <title>Changelog</title>
    <link>{base_url}</link>
    <description>Latest updates and changes</description>
    <language>en-us</language>
    {"".join(rss_items)}
</channel>
</rss>
"""
        return rss_feed

# Helper import needs datetime
from datetime import datetime
