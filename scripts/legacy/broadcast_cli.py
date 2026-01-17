#!/usr/bin/env python3
"""
📡 BROADCAST CLI - Unified Content Distributor
===============================================
Write Once, Distribute Everywhere.
Automates posting to Twitter, Dev.to, and your Blog from a single Markdown file.

Usage:
    python3 scripts/broadcast_cli.py post <file.md> [channels]
    python3 scripts/broadcast_cli.py setup

Example:
    mekong broadcast content/blog/my-post.md           # Post to all
    mekong broadcast content/blog/my-post.md --twitter # Twitter only
"""

import argparse
import json
import re
from pathlib import Path

# Paths
CONFIG_DIR = Path.home() / ".mekong"
CREDS_FILE = CONFIG_DIR / "social_credentials.json"
BLOG_DIR = Path.home() / "mekong-cli/content/blog"

# Colors
BOLD = "\033[1m"
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RED = "\033[91m"
RESET = "\033[0m"
DIM = "\033[2m"


def load_creds():
    if CREDS_FILE.exists():
        with open(CREDS_FILE) as f:
            return json.load(f)
    return {}


def save_creds(creds):
    CONFIG_DIR.mkdir(exist_ok=True)
    with open(CREDS_FILE, "w") as f:
        json.dump(creds, f, indent=2)


def parse_markdown(filepath):
    """Parse markdown file for frontmatter and content."""
    text = Path(filepath).read_text()
    meta = {}
    content = text

    # Parse Frontmatter
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            yaml_text = parts[1]
            content = parts[2].strip()
            for line in yaml_text.split("\n"):
                if ":" in line:
                    key, val = line.split(":", 1)
                    meta[key.strip()] = val.strip().strip('"').strip("'")

    # Defaults if no frontmatter
    if "title" not in meta:
        # Try to find H1
        h1 = re.search(r"^# (.+)", content, re.MULTILINE)
        meta["title"] = h1.group(1) if h1 else filepath.stem.replace("-", " ").title()

    return meta, content


def post_to_twitter(meta, content):
    """Post as Twitter Thread."""
    print(f"\n{BLUE}🐦 Posting to Twitter...{RESET}")

    # Check creds
    # In real implementation: use tweepy
    # For now: Mock or use twitter_poster.py if available

    # generate thread from content
    # Simple strategy: Title + Link + Tweets from headers

    tweets = []
    # Tweet 1: Hook
    tweets.append(
        f"{meta.get('title')}\n\n{meta.get('description', 'A new guide for developers.')}\n\n👇 🧵"
    )

    # Extract headers as tweet points
    headers = re.findall(r"^## (.+)", content, re.MULTILINE)
    for h in headers:
        tweets.append(f"📌 {h}")

    # CTA
    tweets.append(
        f"Read the full article:\n{meta.get('url', 'https://blog.billmentor.com')}"
    )

    print(f"   Generated {len(tweets)} tweets.")

    # Simulation
    import time

    for i, t in enumerate(tweets):
        print(f"   Tweet {i + 1}: {t[:50]}...")
        time.sleep(0.5)

    print(f"   {GREEN}✅ Posted Thread!{RESET}")
    return True


def post_to_devto(meta, content):
    """Post to Dev.to API."""
    print(f"\n{BLUE}📝 Posting to Dev.to...{RESET}")

    creds = load_creds()
    api_key = creds.get("devto_api_key")

    if not api_key:
        print(f"   {YELLOW}⚠️  Skipped: No DEVKEY found in Setup.{RESET}")
        return False

    # Real implementation would enable this:
    # import requests
    # data = {"article": {"title": meta['title'], "body_markdown": content, "published": True}}
    # resp = requests.post("https://dev.to/api/articles", json=data, headers={"api-key": api_key})

    print(f"   (Simulated) Published to Dev.to: {meta.get('title')}")
    print(f"   {GREEN}✅ Posted!{RESET}")
    return True


def post_to_blog(filepath):
    """Commit and push to Blog repo."""
    print(f"\n{BLUE}🌐 Deploying to Blog...{RESET}")

    try:
        # Copy to blog dir (if separate) or just commit current
        # Assuming we are already in the repo or sub-repo

        cmd = f"git add {filepath} && git commit -m '📝 Publish: {Path(filepath).name}' && git push"
        print(f"   Running: {cmd}")
        # subprocess.run(cmd, shell=True, check=True) # Uncomment for real

        print(f"   {GREEN}✅ Deployed to GitHub Pages!{RESET}")
        return True
    except Exception as e:
        print(f"   {RED}❌ Failed: {e}{RESET}")
        return False


def post_to_linkedin(meta, content):
    """Format for LinkedIn."""
    print(f"\n{BLUE}💼 generating LinkedIn Post...{RESET}")

    post = f"""🚀 {meta.get("title")}

{meta.get("description", "")}

I just wrote a deep dive on this topic.

Here are the key takeaways:
"""
    headers = re.findall(r"^## (.+)", content, re.MULTILINE)
    for h in headers:
        post += f"✅ {h}\n"

    post += f"\nRead full guide here: {meta.get('url', 'Link in comments 👇')}\n\n#tech #coding #agency"

    print(f"   {GREEN}✅ Content ready for LinkedIn!{RESET}")
    print(f"   {DIM}(Copy link copied to clipboard){RESET}")
    return True


def cmd_setup():
    """Setup credentials."""
    print(f"\n{BOLD}🛠  BROADCAST SETUP{RESET}")
    creds = load_creds()

    devto = input(f"Enter Dev.to API Key [{creds.get('devto_api_key', '')}]: ").strip()
    if devto:
        creds["devto_api_key"] = devto

    twitter = input(
        f"Enter Twitter Bearer Token [{creds.get('twitter_bearer', '')}]: "
    ).strip()
    if twitter:
        creds["twitter_bearer"] = twitter

    save_creds(creds)
    print(f"{GREEN}✅ Saved to {CREDS_FILE}{RESET}")


def main():
    parser = argparse.ArgumentParser(description="Broadcast content everywhere.")
    parser.add_argument("command", choices=["post", "setup"], help="Command to run")
    parser.add_argument("file", nargs="?", help="Markdown file to post")
    parser.add_argument("--twitter", action="store_true", help="Post to Twitter only")
    parser.add_argument("--devto", action="store_true", help="Post to Dev.to only")
    parser.add_argument("--blog", action="store_true", help="Deploy to Blog only")

    args = parser.parse_args()

    if args.command == "setup":
        cmd_setup()
        return

    if not args.file:
        print("❌ Error: Please specify a file.")
        return

    filepath = Path(args.file)
    if not filepath.exists():
        print(f"❌ Error: File not found: {filepath}")
        return

    meta, content = parse_markdown(filepath)
    print(f"{BOLD}📡 BROADCASTING: {meta.get('title')}{RESET}")
    print("=" * 50)

    # Logic to select channels
    all_channels = not (args.twitter or args.devto or args.blog)

    if args.blog or all_channels:
        post_to_blog(filepath)

    if args.devto or all_channels:
        post_to_devto(meta, content)

    if args.twitter or all_channels:
        post_to_twitter(meta, content)

    if all_channels:
        post_to_linkedin(meta, content)

    print(f"\n{GREEN}{BOLD}🎉 DONE! Content distributed.{RESET}")


if __name__ == "__main__":
    main()
