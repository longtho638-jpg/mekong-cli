# Phase 2 & 3: Core Logic and API

**Status**: In Progress
**Goal**: Implement the Markdown parser, RSS generator, and FastAPI endpoints.

## Steps

1. **Models (`app/models.py`)**
   - `ChangelogEntry`: Pydantic model representing a single update (title, date, type, author, content_html, slug).
   - `ChangelogList`: Response model.

2. **Parser Service (`app/services/parser.py`)**
   - Function `parse_changelogs(data_dir: str) -> List[ChangelogEntry]`.
   - Use `python-frontmatter` to separate metadata.
   - Use `markdown` library to convert body to HTML.
   - Sort by date descending.

3. **Feed Service (`app/services/feed.py`)**
   - Function `generate_rss(entries: List[ChangelogEntry]) -> str`.
   - specific XML structure for RSS 2.0 or Atom.

4. **API Endpoints (`app/api/endpoints.py` & `main.py`)**
   - `GET /api/v1/changelog`: Returns JSON.
   - `GET /feed.xml`: Returns `Response(content=xml, media_type="application/xml")`.

## Deliverables
- Working API that returns parsed data from the sample `.md` files.
- Working RSS feed URL.
