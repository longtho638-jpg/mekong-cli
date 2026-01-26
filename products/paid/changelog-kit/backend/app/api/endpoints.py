from fastapi import APIRouter, Response, HTTPException
from app.core.config import settings
from app.services.parser import ParserService
from app.services.feed import FeedService
from app.models import ChangelogList

router = APIRouter()
parser = ParserService(settings.DATA_DIR)
feed_service = FeedService()

@router.get("/changelog", response_model=ChangelogList)
async def get_changelog():
    entries = parser.parse_changelogs()
    return ChangelogList(entries=entries, total=len(entries))

@router.get("/feed.xml")
async def get_rss_feed():
    entries = parser.parse_changelogs()
    rss_content = feed_service.generate_rss(entries)
    return Response(content=rss_content, media_type="application/xml")

@router.get("/latest")
async def get_latest_version():
    entries = parser.parse_changelogs()
    if not entries:
        return {"version": None, "date": None}

    latest = entries[0]
    return {
        "version": latest.title, # Assuming title contains version or is the version
        "date": latest.date,
        "slug": latest.slug
    }
