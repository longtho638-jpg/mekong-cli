#!/usr/bin/env python3
"""
🐦 Twitter Auto-Poster via API
==============================
Posts tweets directly using Twitter API.
No copy-paste needed.

Setup:
1. Set TWITTER_BEARER_TOKEN env var
2. Run: python3 scripts/twitter_poster.py

OR use browser automation (no API needed):
    python3 scripts/twitter_poster.py --browser
"""

import os
import sys
from pathlib import Path

try:
    import tweepy

    HAS_TWEEPY = True
except ImportError:
    HAS_TWEEPY = False


def get_latest_draft():
    """Get latest tweet draft."""
    drafts_dir = Path("marketing/drafts")
    if not drafts_dir.exists():
        return None

    drafts = sorted(drafts_dir.glob("tweet_*.md"), reverse=True)
    if not drafts:
        return None

    content = drafts[0].read_text()
    return content, drafts[0]


def parse_tweets(content):
    """Parse tweets from markdown content."""
    tweets = []
    lines = content.split("\n")
    current_tweet = []
    in_tweet = False

    for line in lines:
        if line.startswith("### Tweet"):
            if current_tweet:
                tweets.append("\n".join(current_tweet).strip())
            current_tweet = []
            in_tweet = True
        elif line.startswith("### CTA") or line.startswith("## CTA"):
            if current_tweet:
                tweets.append("\n".join(current_tweet).strip())
            current_tweet = []
            in_tweet = True
        elif line.startswith("---"):
            if current_tweet:
                tweets.append("\n".join(current_tweet).strip())
                current_tweet = []
            in_tweet = False
        elif in_tweet and line.strip():
            current_tweet.append(line)

    if current_tweet:
        tweets.append("\n".join(current_tweet).strip())

    # Clean up empty tweets
    tweets = [t for t in tweets if t and len(t) > 5]
    return tweets


def post_via_api(tweets):
    """Post tweets via Twitter API."""
    if not HAS_TWEEPY:
        print("❌ tweepy not installed. Run: pip install tweepy")
        return False

    bearer_token = os.environ.get("TWITTER_BEARER_TOKEN")
    api_key = os.environ.get("TWITTER_API_KEY")
    api_secret = os.environ.get("TWITTER_API_SECRET")
    access_token = os.environ.get("TWITTER_ACCESS_TOKEN")
    access_secret = os.environ.get("TWITTER_ACCESS_SECRET")

    if not all([api_key, api_secret, access_token, access_secret]):
        print("❌ Twitter API credentials not set")
        print("   Set: TWITTER_API_KEY, TWITTER_API_SECRET,")
        print("        TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET")
        return False

    client = tweepy.Client(
        consumer_key=api_key,
        consumer_secret=api_secret,
        access_token=access_token,
        access_token_secret=access_secret,
    )

    prev_id = None
    for i, tweet in enumerate(tweets):
        try:
            if prev_id:
                response = client.create_tweet(text=tweet, in_reply_to_tweet_id=prev_id)
            else:
                response = client.create_tweet(text=tweet)
            prev_id = response.data["id"]
            print(f"✅ Tweet {i + 1}/{len(tweets)} posted!")
        except Exception as e:
            print(f"❌ Failed: {e}")
            return False

    return True


def show_preview():
    """Show tweet preview for manual posting."""
    result = get_latest_draft()
    if not result:
        print("❌ No draft found")
        return

    content, path = result
    tweets = parse_tweets(content)

    print("\n🐦 TWITTER THREAD PREVIEW")
    print("=" * 50)
    print(f"📄 Source: {path.name}")
    print(f"📊 Tweets: {len(tweets)}")
    print("=" * 50)

    for i, tweet in enumerate(tweets, 1):
        print(f"\n--- Tweet {i} ---")
        print(tweet)
        print(f"[{len(tweet)} chars]")

    print("\n" + "=" * 50)
    print("💡 To post manually, copy each tweet above")
    print("🤖 To auto-post: Set Twitter API keys")
    print("=" * 50 + "\n")


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--post":
        result = get_latest_draft()
        if not result:
            print("❌ No draft found")
            return
        content, _ = result
        tweets = parse_tweets(content)
        post_via_api(tweets)
    else:
        show_preview()


if __name__ == "__main__":
    main()
