#!/usr/bin/env python3
import os
import sys


def count_lines(filepath):
    """Count lines in a file, skipping empty lines and comments if needed.
    For now, we count all lines as per the strict 200 LOC rule.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return sum(1 for line in f)
    except Exception:
        # print(f"Error reading {filepath}: {e}", file=sys.stderr)
        return 0

def scan_directory(root_dir, max_lines=200):
    """Scan directory for files exceeding max_lines."""
    over_limit_files = []

    # Exclude patterns
    exclude_dirs = {
        '.git', 'node_modules', 'dist', 'build', '__pycache__', '.venv', 'env', 'venv',
        '.next', '.claude', '.agencyos', 'external', 'products', 'mekong-docs'
    }
    # Extensions to check
    extensions = {'.py', '.ts', '.tsx', '.js', '.jsx'}

    for root, dirs, files in os.walk(root_dir):
        # Modify dirs in-place to skip excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]

        for file in files:
            ext = os.path.splitext(file)[1]
            if ext in extensions:
                filepath = os.path.join(root, file)
                # Skip the script itself if it's in the tree
                if os.path.abspath(filepath) == os.path.abspath(__file__):
                    continue

                lines = count_lines(filepath)
                if lines > max_lines:
                    over_limit_files.append((lines, filepath))

    # Sort by line count descending
    over_limit_files.sort(key=lambda x: x[0], reverse=True)

    return over_limit_files

def main():
    root = os.getcwd()
    if len(sys.argv) > 1:
        root = sys.argv[1]

    print(f"Scanning {root} for files > 200 lines...")
    over_limit = scan_directory(root)

    if not over_limit:
        print("✅ No files exceed 200 lines!")
        sys.exit(0)

    print(f"❌ Found {len(over_limit)} files exceeding 200 lines:")
    print(f"{'Lines':<8} | {'File'}")
    print("-" * 60)
    for lines, filepath in over_limit:
        relpath = os.path.relpath(filepath, root)
        print(f"{lines:<8} | {relpath}")

    sys.exit(1)

if __name__ == "__main__":
    main()
