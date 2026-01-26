# Search Index Kit

A powerful, production-ready full-text search solution built with FastAPI, PostgreSQL, and React.

## Features

- **Full-Text Search**: Leverage PostgreSQL's robust `tsvector` and `tsquery` capabilities.
- **Ranking**: Weighted ranking algorithms to surface the most relevant results.
- **Autocomplete**: Fast typeahead suggestions.
- **Faceted Search**: Filter results by category and tags.
- **Analytics**: Track search queries, click-throughs, and zero-result queries.
- **React Components**: Ready-to-use SearchBar, Results, and Filters.

## Architecture

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, Pydantic
- **Database**: PostgreSQL with `pg_trgm` (optional but recommended)
- **Frontend**: React 19, TypeScript, Tailwind CSS

## Getting Started

### Backend Setup

1.  **Prerequisites**: Python 3.11+, PostgreSQL running.
2.  **Environment Variables**: Create `.env` in `backend/`
    ```
    DATABASE_URL=postgresql://user:password@localhost:5432/search_db
    ```
3.  **Install Dependencies**:
    ```bash
    cd backend
    pip install -r requirements.txt
    ```
4.  **Run Migrations & App**:
    ```bash
    # This will create tables automatically on startup
    uvicorn main:app --reload
    ```

### Frontend Setup

1.  **Prerequisites**: Node.js 18+
2.  **Install Dependencies**:
    ```bash
    cd frontend
    npm install
    ```
3.  **Start Development Server**:
    ```bash
    npm start
    ```

## API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for the interactive Swagger UI.

### Key Endpoints

-   `POST /api/search`: Perform a full-text search.
-   `GET /api/search/autocomplete`: Get suggestions.
-   `GET /api/search/facets`: Get available filters.
-   `POST /api/search/analytics`: Log search events.
-   `POST /api/documents`: Index a new document.

## Indexing Content

To index content, simply POST to `/api/documents`:

```json
{
  "title": "Getting Started with API",
  "content": "This is a guide on how to use the API...",
  "url": "/docs/getting-started",
  "category": "documentation",
  "tags": "api,guide"
}
```

The system automatically updates the search vector.

## License

MIT
