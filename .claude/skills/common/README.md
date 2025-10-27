# Common Skill Utilities

This directory contains shared utilities used across multiple skills.

## API Key Helper

`api_key_helper.py` provides standardized GEMINI_API_KEY detection for all Gemini-based skills.

### Usage in Skills

```python
import sys
from pathlib import Path

# Add common directory to path
common_dir = Path(__file__).parent.parent.parent / 'common'
sys.path.insert(0, str(common_dir))

from api_key_helper import get_api_key_or_exit

# Get API key with automatic error handling
api_key = get_api_key_or_exit()
```

### API Key Lookup Order

The helper checks for `GEMINI_API_KEY` in this order:

1. **Process environment variable** (recommended for development)
   ```bash
   export GEMINI_API_KEY='your-api-key'
   ```

2. **Project root `.env` file**
   ```bash
   echo 'GEMINI_API_KEY=your-api-key' > .env
   ```

3. **.claude/.env file**
   ```bash
   echo 'GEMINI_API_KEY=your-api-key' > .claude/.env
   ```

4. **.claude/skills/.env file** (shared across all Gemini skills)
   ```bash
   echo 'GEMINI_API_KEY=your-api-key' > .claude/skills/.env
   ```

5. **Skill directory `.env` file**
   ```bash
   echo 'GEMINI_API_KEY=your-api-key' > .claude/skills/your-skill/.env
   ```

### Error Handling

If the API key is not found, the helper will:
- Print a clear error message
- Show all available methods to set the API key
- Provide the URL to obtain an API key
- Exit with status code 1

This ensures users get immediate, actionable feedback when the API key is missing.
