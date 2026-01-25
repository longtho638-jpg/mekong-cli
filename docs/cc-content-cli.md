# CC Content CLI - Content Automation Documentation

## Overview

`cc_content.py` is a content automation CLI tool with AI-powered features for content ideation, drafting, scheduling, and multi-platform publishing.

## Features

✅ **AI Content Ideas** - Generate content ideas with customizable pillars
✅ **AI Drafting** - Create content drafts with tone and length controls
✅ **Content Calendar** - View and manage scheduled content
✅ **Multi-Platform Publishing** - Publish to Twitter, LinkedIn, Medium, Dev.to
✅ **Scheduling** - Schedule content for automatic publishing
✅ **Status Tracking** - Track content through draft → scheduled → published states

## Installation

The script is located at: `scripts/cc_content.py`

Data is stored in: `~/.cc_content.json`

## Commands

### 1. Generate Content Ideas

Generate AI-powered content ideas:

```bash
# Generate 5 default ideas
python3 scripts/cc_content.py ideas

# Generate ideas for specific pillar
python3 scripts/cc_content.py ideas --pillar tutorials

# Generate custom number of ideas
python3 scripts/cc_content.py ideas --count 10 --pillar case-studies
```

**Options:**
- `--pillar` - Content pillar (tutorials, case-studies, industry-news, thought-leadership)
- `--count` - Number of ideas to generate (default: 5)

### 2. Draft Content with AI

Create content drafts with AI assistance:

```bash
# Draft an article
python3 scripts/cc_content.py draft "API Security Best Practices"

# Draft with custom settings
python3 scripts/cc_content.py draft "How to Scale Startups" \
  --type article \
  --tone technical \
  --length long

# Draft a tweet
python3 scripts/cc_content.py draft "Quick Productivity Tip" \
  --type tweet \
  --tone casual \
  --length short
```

**Options:**
- `--type` - Content type: article, tweet, linkedin_post, video_script (default: article)
- `--tone` - Content tone: professional, casual, technical, friendly (default: professional)
- `--length` - Content length: short (300-500), medium (800-1200), long (1500-2500) (default: medium)

### 3. List Content Items

View all content items:

```bash
# List all content
python3 scripts/cc_content.py list

# Filter by status
python3 scripts/cc_content.py list --status draft
python3 scripts/cc_content.py list --status scheduled
python3 scripts/cc_content.py list --status published
```

### 4. Schedule Content

Schedule content for publishing:

```bash
# Schedule content by ID
python3 scripts/cc_content.py schedule 1 "2026-01-26 10:00"

# Schedule format: YYYY-MM-DD HH:MM
python3 scripts/cc_content.py schedule 2 "2026-02-01 14:30"
```

### 5. View Content Calendar

Display scheduled content:

```bash
# Show next 30 days (default)
python3 scripts/cc_content.py calendar

# Show next 7 days
python3 scripts/cc_content.py calendar --days 7

# Show next 90 days
python3 scripts/cc_content.py calendar --days 90
```

### 6. Publish Content

Publish content to platforms:

```bash
# Publish to single platform
python3 scripts/cc_content.py publish 1 --platforms twitter

# Publish to multiple platforms
python3 scripts/cc_content.py publish 1 --platforms twitter,linkedin,medium

# Publish to all configured platforms
python3 scripts/cc_content.py publish 1 --platforms twitter,linkedin,medium,dev.to
```

**Supported Platforms:**
- `twitter` - Twitter/X
- `linkedin` - LinkedIn
- `medium` - Medium
- `dev.to` - Dev.to

**Note:** Platforms must be configured with API keys before publishing. Edit `~/.cc_content.json`:

```json
{
  "platforms": {
    "twitter": {
      "enabled": true,
      "api_key": "your-api-key-here"
    }
  }
}
```

## Workflow Example

Complete workflow from ideation to publishing:

```bash
# 1. Generate ideas
python3 scripts/cc_content.py ideas --pillar tutorials --count 5

# 2. Draft selected topic
python3 scripts/cc_content.py draft "10 Essential Git Commands" \
  --type article \
  --tone professional \
  --length medium

# 3. List content to get ID
python3 scripts/cc_content.py list

# 4. Schedule the content (assuming ID is 1)
python3 scripts/cc_content.py schedule 1 "2026-01-26 10:00"

# 5. View calendar
python3 scripts/cc_content.py calendar

# 6. Publish to platforms (when ready)
python3 scripts/cc_content.py publish 1 --platforms twitter,linkedin
```

## Content States

Content items move through these states:

1. **draft** - Initial state after creation
2. **scheduled** - After scheduling with a date
3. **published** - After successful publishing to platforms

## AI Integration

The CLI includes placeholder AI integration for:
- Content idea generation
- Draft creation with tone and length control
- Future: Integration with `antigravity/core/agent` modules

**Note:** Full AI integration requires:
- Antigravity core agent modules
- AI model credentials (OpenAI, Gemini, etc.)
- Network connectivity to AI services

Current implementation provides simulated AI responses as templates.

## Data Storage

All data is stored in JSON format at: `~/.cc_content.json`

**Database Structure:**
```json
{
  "content_items": [],      // All content items
  "calendar": [],           // Reserved for future use
  "platforms": {},          // Platform configurations
  "settings": {
    "default_tone": "professional",
    "default_length": "medium",
    "content_pillars": []
  }
}
```

## Configuration

### Content Pillars

Default pillars defined in settings:
- tutorials
- industry-news
- case-studies
- thought-leadership

Edit `~/.cc_content.json` to customize pillars:

```json
{
  "settings": {
    "content_pillars": ["tutorials", "case-studies", "product-updates", "customer-stories"]
  }
}
```

### Platform Configuration

Enable platforms and add API keys:

```json
{
  "platforms": {
    "twitter": {
      "enabled": true,
      "api_key": "your-twitter-api-key"
    },
    "linkedin": {
      "enabled": true,
      "api_key": "your-linkedin-api-key"
    }
  }
}
```

## Error Handling

The CLI provides clear error messages:

- **Content not found**: Invalid content ID
- **Invalid date format**: Use YYYY-MM-DD HH:MM
- **Platform not configured**: Platform must be enabled with API key

## Future Enhancements

Planned features:
- [ ] Real AI integration with antigravity core
- [ ] Automatic publishing via scheduled jobs
- [ ] Content analytics and performance tracking
- [ ] Template library for common content types
- [ ] Bulk operations (bulk draft, bulk schedule)
- [ ] Content versioning and revision history
- [ ] SEO optimization suggestions
- [ ] Image/media attachment support

## Support

For issues or questions:
- Check `~/.cc_content.json` for data integrity
- Verify platform API credentials
- Review error messages for specific issues

## License

MIT - Part of AgencyOS CLI toolkit
