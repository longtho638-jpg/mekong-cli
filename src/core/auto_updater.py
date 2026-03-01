"""
Mekong CLI - Auto Updater

Electron's autoUpdater (Squirrel) mapped to CLI self-update via pip.
Checks GitHub Releases API for newer versions, downloads the release
asset, and applies updates in-place. Supports rollback. Caches checks
for 1 hour to avoid redundant API calls.
"""

import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Optional, Tuple

import requests


class UpdateChannel(Enum):
    """Release channels controlling which updates are offered."""

    STABLE = "stable"
    BETA = "beta"
    NIGHTLY = "nightly"


@dataclass
class UpdateInfo:
    """Metadata for an available update fetched from GitHub Releases."""

    version: str
    channel: UpdateChannel
    download_url: str
    release_notes: str
    published_at: str
    checksum: str


_RELEASES_URL = "{repo_url}/releases"
_CACHE_TTL = 3600  # seconds


class AutoUpdater:
    """CLI self-update manager inspired by Electron's autoUpdater (Squirrel).

    Queries GitHub Releases for newer versions, downloads the release asset,
    and applies the update via pip. Supports rollback to a previous version.

    Args:
        current_version: Installed version string, e.g. "2.2.0".
        repo_url: GitHub API base, e.g. "https://api.github.com/repos/org/repo".
        channel: Release channel filter (STABLE, BETA, NIGHTLY).
    """

    def __init__(self, current_version: str, repo_url: str, channel: UpdateChannel = UpdateChannel.STABLE) -> None:
        self.current_version = current_version
        self.repo_url = repo_url.rstrip("/")
        self.channel = channel
        self._cache: Optional[UpdateInfo] = None
        self._cache_at: float = 0.0

    def check_for_updates(self) -> Optional[UpdateInfo]:
        """Query GitHub Releases API for a newer version; cached for 1 hour.

        Returns UpdateInfo if a newer version is available, else None.
        """
        now = time.time()
        if self._cache is not None and (now - self._cache_at) < _CACHE_TTL:
            return self._cache

        response = requests.get(_RELEASES_URL.format(repo_url=self.repo_url), timeout=10)
        response.raise_for_status()

        for release in response.json():
            tag: str = release.get("tag_name", "")
            if self.channel == UpdateChannel.STABLE and release.get("prerelease"):
                continue
            if self.channel == UpdateChannel.BETA and not tag.startswith("beta-"):
                continue
            if self.channel == UpdateChannel.NIGHTLY and not tag.startswith("nightly-"):
                continue

            version = tag.lstrip("v").lstrip("beta-").lstrip("nightly-")
            if self._parse_version(version) <= self._parse_version(self.current_version):
                break

            assets = release.get("assets", [])
            if not assets:
                continue

            body = release.get("body", "")
            checksum = body.split("sha256:")[-1].split()[0] if "sha256:" in body else ""
            update_info = UpdateInfo(
                version=version,
                channel=self.channel,
                download_url=assets[0]["browser_download_url"],
                release_notes=body,
                published_at=release.get("published_at", ""),
                checksum=checksum,
            )
            self._cache, self._cache_at = update_info, now
            return update_info

        self._cache, self._cache_at = None, now
        return None

    def download(self, update_info: UpdateInfo) -> Path:
        """Download release asset to a temp dir. Returns path to downloaded file."""
        response = requests.get(update_info.download_url, stream=True, timeout=30)
        response.raise_for_status()
        tmp_dir = Path(tempfile.mkdtemp(prefix="mekong-update-"))
        filename = update_info.download_url.split("/")[-1] or f"mekong-{update_info.version}.tar.gz"
        dest = tmp_dir / filename
        with dest.open("wb") as fh:
            for chunk in response.iter_content(chunk_size=8192):
                fh.write(chunk)
        return dest

    def apply(self, update_path: Path) -> bool:
        """Install downloaded package via pip. Returns True on success."""
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", str(update_path), "--quiet"],
            capture_output=True,
        )
        return result.returncode == 0

    def rollback(self, previous_version: str) -> bool:
        """Reinstall a specific previous version from PyPI. Returns True on success."""
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", f"mekong-cli=={previous_version}", "--quiet"],
            capture_output=True,
        )
        return result.returncode == 0

    def _parse_version(self, version_str: str) -> Tuple[int, ...]:
        """Parse semver string into comparable int tuple, e.g. "2.2.0" → (2, 2, 0)."""
        try:
            return tuple(int(p) for p in version_str.strip().split("."))
        except ValueError:
            return (0,)


__all__ = ["UpdateChannel", "UpdateInfo", "AutoUpdater"]
