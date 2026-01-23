# Playwright Skill

This skill integrates [Playwright](https://playwright.dev/python/) for browser automation.

## Features

- **Headless Browsing**: Automate web interactions.
- **Testing**: E2E testing capabilities.
- **Scraping**: Extract data from dynamic websites.

## Usage

```bash
# First time setup (installs browsers)
playwright install chromium

# Run skill
python .agent/skills/playwright/skill.py "https://google.com"
```

## Requirements

- `playwright`
- Browsers installed via `playwright install`
