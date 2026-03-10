"""
Vibe Coding Factory — Command Classifier.

Scans .agencyos/commands/*.md and .claude/commands/*.md, maps each
command file to a factory layer based on layers.yaml command lists,
and outputs a classification report.

Usage:
    python3 factory/classify-commands.py
    python3 factory/classify-commands.py --strict   # fail on unclassified
    python3 factory/classify-commands.py --quick    # pre-commit mode (no report)
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

import yaml

logger = logging.getLogger(__name__)

_REPO_ROOT = Path(__file__).parent.parent
_FACTORY_DIR = Path(__file__).parent
_COMMAND_DIRS = [
    _REPO_ROOT / ".agencyos" / "commands",
    _REPO_ROOT / ".claude" / "commands",
]


def _load_layers(layers_path: Path) -> dict[str, list[str]]:
    """Load layer → commands mapping from layers.yaml."""
    try:
        with layers_path.open("r", encoding="utf-8") as fh:
            data = yaml.safe_load(fh) or {}
    except FileNotFoundError:
        logger.error("layers.yaml not found at %s", layers_path)
        sys.exit(1)

    result: dict[str, list[str]] = {}
    for layer_name, layer_cfg in data.get("layers", {}).items():
        result[layer_name] = [c.lower() for c in layer_cfg.get("commands", [])]
    return result


def _collect_command_files(dirs: list[Path]) -> list[Path]:
    """Collect all *.md command files from given directories."""
    files: list[Path] = []
    for d in dirs:
        if d.exists():
            files.extend(sorted(d.glob("*.md")))
        else:
            logger.debug("Command dir not found, skipping: %s", d)
    return files


def _stem_to_command(path: Path) -> str:
    """Convert a filename stem to a command name (lowercase, hyphens)."""
    return path.stem.lower().replace("_", "-")


def _classify(
    command: str,
    layer_map: dict[str, list[str]],
) -> str | None:
    """Return the layer name for a command, or None if unclassified."""
    for layer, commands in layer_map.items():
        if command in commands:
            return layer
    return None


def _build_report(
    classified: list[tuple[str, str, Path]],
    unclassified: list[tuple[str, Path]],
) -> str:
    """Build a human-readable classification report."""
    lines: list[str] = ["# Command Classification Report", ""]

    # Group by layer
    by_layer: dict[str, list[str]] = {}
    for cmd, layer, src in classified:
        by_layer.setdefault(layer, []).append(f"  - {cmd}  ({src.name})")

    for layer in sorted(by_layer):
        lines.append(f"## {layer.upper()} ({len(by_layer[layer])} commands)")
        lines.extend(by_layer[layer])
        lines.append("")

    if unclassified:
        lines.append(f"## UNCLASSIFIED ({len(unclassified)} commands)")
        for cmd, src in unclassified:
            lines.append(f"  - {cmd}  ({src.name})")
        lines.append("")

    total = len(classified) + len(unclassified)
    pct = int(100 * len(classified) / total) if total else 0
    lines.append("## Summary")
    lines.append(f"  Total: {total}")
    lines.append(f"  Classified: {len(classified)} ({pct}%)")
    lines.append(f"  Unclassified: {len(unclassified)}")
    return "\n".join(lines)


def main() -> None:
    """Entry point for command classifier."""
    logging.basicConfig(
        level=logging.WARNING,
        format="%(levelname)s %(message)s",
    )

    parser = argparse.ArgumentParser(
        description="Classify command files into factory layers."
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with code 1 if any commands are unclassified.",
    )
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Pre-commit mode: print summary only, no full report.",
    )
    args = parser.parse_args()

    layer_map = _load_layers(_FACTORY_DIR / "layers.yaml")
    command_files = _collect_command_files(_COMMAND_DIRS)

    if not command_files:
        print("No command files found in:", [str(d) for d in _COMMAND_DIRS])
        sys.exit(0)

    classified: list[tuple[str, str, Path]] = []
    unclassified: list[tuple[str, Path]] = []

    for fpath in command_files:
        cmd = _stem_to_command(fpath)
        layer = _classify(cmd, layer_map)
        if layer:
            classified.append((cmd, layer, fpath))
        else:
            unclassified.append((cmd, fpath))

    if args.quick:
        total = len(classified) + len(unclassified)
        pct = int(100 * len(classified) / total) if total else 0
        print(
            f"Commands: {total} total | {len(classified)} classified ({pct}%) "
            f"| {len(unclassified)} unclassified"
        )
        if args.strict and unclassified:
            print("STRICT: unclassified commands detected — failing.")
            sys.exit(1)
        return

    report = _build_report(classified, unclassified)
    print(report)

    if args.strict and unclassified:
        print("\nSTRICT MODE: unclassified commands detected — exiting with code 1.")
        sys.exit(1)


if __name__ == "__main__":
    main()
