# Supabase Agent Skills

This skill integrates Supabase capabilities into the Antigravity Agent system, following the [Agent Skills](https://github.com/supabase/agent-skills) pattern.

## Features

- **Database Management**: Execute SQL, manage tables.
- **Auth**: Manage users (if admin key provided).
- **Vector Store**: Interface with pgvector.

## Usage

This skill provides a foundation for Supabase interactions.

```python
# Example usage (conceptual)
from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

data = supabase.table("countries").select("*").execute()
```

## Requirements

- `supabase` python package
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
