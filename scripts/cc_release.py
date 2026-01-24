#!/usr/bin/env python3
"""
🏯 AgencyOS Release Automation System
Production-grade release pipeline with version management, building, publishing, and deployment.

Commands:
  cc release create <version>        - Create git tag + changelog
  cc release build                   - Build Docker image + Python package
  cc release publish                 - Publish to registry (Docker Hub, PyPI)
  cc release deploy staging          - Deploy to staging environment
  cc release deploy production       - Deploy to production with safety checks
  cc release rollback                - Rollback to previous version

Author: Antigravity Team
License: MIT
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# ANSI color codes for terminal output
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"


class ReleaseManager:
    """Manages the complete release lifecycle for AgencyOS"""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.setup_py = project_root / "setup.py"
        self.package_json = project_root / "package.json"
        self.dockerfile = project_root / "Dockerfile"
        self.changelog = project_root / "CHANGELOG.md"
        self.version_file = project_root / "VERSION"

    def log(self, message: str, level: str = "info"):
        """Print colored log messages"""
        colors = {
            "info": Colors.BLUE,
            "success": Colors.GREEN,
            "warning": Colors.YELLOW,
            "error": Colors.RED,
            "header": Colors.MAGENTA
        }
        color = colors.get(level, Colors.RESET)
        print(f"{color}{message}{Colors.RESET}")

    def run_command(self, cmd: List[str], check: bool = True, capture: bool = False) -> Tuple[int, str, str]:
        """Execute a shell command and return result"""
        try:
            if capture:
                result = subprocess.run(
                    cmd,
                    cwd=self.project_root,
                    capture_output=True,
                    text=True,
                    check=check
                )
                return result.returncode, result.stdout.strip(), result.stderr.strip()
            else:
                result = subprocess.run(cmd, cwd=self.project_root, check=check)
                return result.returncode, "", ""
        except subprocess.CalledProcessError as e:
            if check:
                raise
            return e.returncode, "", str(e)

    def get_current_version(self) -> str:
        """Get current version from setup.py"""
        if not self.setup_py.exists():
            return "0.0.0"

        with open(self.setup_py, 'r') as f:
            content = f.read()
            match = re.search(r'version\s*=\s*["\']([^"\']+)["\']', content)
            if match:
                return match.group(1)
        return "0.0.0"

    def validate_version(self, version: str) -> bool:
        """Validate semantic version format (x.y.z)"""
        pattern = r'^\d+\.\d+\.\d+$'
        return bool(re.match(pattern, version))

    def update_version_files(self, version: str):
        """Update version in all relevant files"""
        self.log(f"📝 Updating version to {version} in all files...", "info")

        # Update setup.py
        if self.setup_py.exists():
            with open(self.setup_py, 'r') as f:
                content = f.read()
            content = re.sub(
                r'version\s*=\s*["\'][^"\']+["\']',
                f'version="{version}"',
                content
            )
            with open(self.setup_py, 'w') as f:
                f.write(content)
            self.log("  ✓ Updated setup.py", "success")

        # Update VERSION file
        with open(self.version_file, 'w') as f:
            f.write(f"{version}\n")
        self.log("  ✓ Created/updated VERSION file", "success")

        # Update package.json version (keep as 0.0.0 for monorepo root)
        # Individual packages manage their own versions

        self.log(f"✅ Version updated to {version}", "success")

    def generate_changelog(self, version: str) -> str:
        """Generate changelog from git commits since last tag"""
        self.log("📋 Generating changelog...", "info")

        # Get last tag
        returncode, last_tag, _ = self.run_command(
            ["git", "describe", "--tags", "--abbrev=0"],
            check=False,
            capture=True
        )

        if returncode != 0:
            last_tag = ""
            commit_range = "HEAD"
        else:
            commit_range = f"{last_tag}..HEAD"

        # Get commits
        _, commits, _ = self.run_command(
            ["git", "log", commit_range, "--pretty=format:%h|%s|%an|%ad", "--date=short"],
            capture=True
        )

        if not commits:
            return ""

        # Parse commits into categories
        features = []
        fixes = []
        docs = []
        other = []

        for line in commits.split("\n"):
            if not line:
                continue
            parts = line.split("|")
            if len(parts) != 4:
                continue

            hash_val, message, author, date = parts
            commit_entry = f"- {message} ([{hash_val}])"

            msg_lower = message.lower()
            if msg_lower.startswith("feat") or "feature" in msg_lower:
                features.append(commit_entry)
            elif msg_lower.startswith("fix") or "bug" in msg_lower:
                fixes.append(commit_entry)
            elif msg_lower.startswith("docs") or "documentation" in msg_lower:
                docs.append(commit_entry)
            else:
                other.append(commit_entry)

        # Build changelog entry
        changelog_entry = f"\n## [{version}] - {datetime.now().strftime('%Y-%m-%d')}\n\n"

        if features:
            changelog_entry += "### ✨ Features\n" + "\n".join(features) + "\n\n"
        if fixes:
            changelog_entry += "### 🐛 Bug Fixes\n" + "\n".join(fixes) + "\n\n"
        if docs:
            changelog_entry += "### 📚 Documentation\n" + "\n".join(docs) + "\n\n"
        if other:
            changelog_entry += "### 🔧 Other Changes\n" + "\n".join(other) + "\n\n"

        return changelog_entry

    def update_changelog(self, changelog_entry: str):
        """Prepend new changelog entry to CHANGELOG.md"""
        if not changelog_entry:
            self.log("⚠️  No commits to add to changelog", "warning")
            return

        if self.changelog.exists():
            with open(self.changelog, 'r') as f:
                existing_content = f.read()
        else:
            existing_content = "# Changelog\n\nAll notable changes to AgencyOS will be documented in this file.\n"

        # Insert new entry after header
        lines = existing_content.split("\n")
        header_end = 2  # After "# Changelog" and description

        new_content = "\n".join(lines[:header_end]) + "\n" + changelog_entry + "\n".join(lines[header_end:])

        with open(self.changelog, 'w') as f:
            f.write(new_content)

        self.log("  ✓ Updated CHANGELOG.md", "success")

    def create_git_tag(self, version: str, message: str):
        """Create annotated git tag"""
        self.log(f"🏷️  Creating git tag v{version}...", "info")

        # Create tag
        self.run_command(["git", "tag", "-a", f"v{version}", "-m", message])
        self.log(f"  ✓ Created tag v{version}", "success")

    def build_docker_image(self, version: str, tag_latest: bool = False):
        """Build Docker image"""
        self.log(f"🐳 Building Docker image...", "info")

        if not self.dockerfile.exists():
            self.log("  ⚠️  Dockerfile not found, skipping Docker build", "warning")
            return

        image_name = "agencyos/mekong-cli"

        # Build with version tag
        self.log(f"  Building {image_name}:{version}...", "info")
        self.run_command([
            "docker", "build",
            "-t", f"{image_name}:{version}",
            "."
        ])

        # Tag as latest if requested
        if tag_latest:
            self.log(f"  Tagging as latest...", "info")
            self.run_command([
                "docker", "tag",
                f"{image_name}:{version}",
                f"{image_name}:latest"
            ])

        self.log(f"  ✅ Docker image built: {image_name}:{version}", "success")

    def build_python_package(self):
        """Build Python package (wheel + sdist)"""
        self.log("📦 Building Python package...", "info")

        # Clean previous builds
        dist_dir = self.project_root / "dist"
        if dist_dir.exists():
            import shutil
            shutil.rmtree(dist_dir)

        # Build package
        self.run_command([sys.executable, "setup.py", "sdist", "bdist_wheel"])

        # List built files
        if dist_dir.exists():
            files = list(dist_dir.glob("*"))
            self.log("  ✓ Built packages:", "success")
            for f in files:
                self.log(f"    - {f.name}", "info")

    def publish_docker_image(self, version: str, push_latest: bool = False):
        """Push Docker image to Docker Hub"""
        self.log("🚀 Publishing Docker image...", "info")

        image_name = "agencyos/mekong-cli"

        # Push version tag
        self.log(f"  Pushing {image_name}:{version}...", "info")
        self.run_command(["docker", "push", f"{image_name}:{version}"])

        # Push latest tag if requested
        if push_latest:
            self.log(f"  Pushing {image_name}:latest...", "info")
            self.run_command(["docker", "push", f"{image_name}:latest"])

        self.log(f"  ✅ Docker image published", "success")

    def publish_pypi_package(self, test: bool = False):
        """Publish Python package to PyPI or TestPyPI"""
        self.log("📤 Publishing to PyPI...", "info")

        repository = "--repository testpypi" if test else ""

        try:
            # Use twine to upload
            self.run_command([
                "python", "-m", "twine", "upload",
                *repository.split(),
                "dist/*"
            ])
            self.log(f"  ✅ Published to {'TestPyPI' if test else 'PyPI'}", "success")
        except Exception as e:
            self.log(f"  ⚠️  Twine not installed. Install with: pip install twine", "warning")
            self.log(f"  Error: {e}", "error")

    def deploy_to_environment(self, env: str, version: Optional[str] = None):
        """Deploy to staging or production environment"""
        self.log(f"🚀 Deploying to {env}...", "header")

        if env == "production":
            # Production safety checks
            self.log("🔒 Running production safety checks...", "info")

            # Check if working directory is clean
            returncode, status, _ = self.run_command(
                ["git", "status", "--porcelain"],
                capture=True
            )
            if status:
                self.log("  ❌ Working directory is not clean. Commit changes first.", "error")
                sys.exit(1)

            # Confirm deployment
            response = input(f"{Colors.YELLOW}⚠️  Deploy to PRODUCTION? (yes/no): {Colors.RESET}")
            if response.lower() != "yes":
                self.log("  ❌ Deployment cancelled", "error")
                sys.exit(1)

        # Get version to deploy
        if not version:
            version = self.get_current_version()

        self.log(f"  Deploying version {version} to {env}...", "info")

        # Example deployment commands (customize for your infrastructure)
        # This could integrate with:
        # - Kubernetes: kubectl apply
        # - Docker Swarm: docker stack deploy
        # - Cloud providers: aws ecs update-service, gcloud app deploy, etc.

        deployment_script = self.project_root / f"deploy-{env}.sh"
        if deployment_script.exists():
            self.log(f"  Running deployment script: {deployment_script}", "info")
            self.run_command(["bash", str(deployment_script), version])
        else:
            self.log(f"  ⚠️  No deployment script found: {deployment_script}", "warning")
            self.log(f"  💡 Create a deployment script for automated deployments", "info")

        self.log(f"  ✅ Deployment to {env} initiated", "success")

    def rollback(self):
        """Rollback to previous version"""
        self.log("⏪ Rolling back to previous version...", "header")

        # Get previous tag
        returncode, tags, _ = self.run_command(
            ["git", "tag", "-l", "--sort=-version:refname"],
            capture=True
        )

        if returncode != 0 or not tags:
            self.log("  ❌ No previous tags found", "error")
            sys.exit(1)

        tag_list = tags.split("\n")
        if len(tag_list) < 2:
            self.log("  ❌ No previous version to rollback to", "error")
            sys.exit(1)

        current_tag = tag_list[0]
        previous_tag = tag_list[1]

        self.log(f"  Current: {current_tag}", "info")
        self.log(f"  Rolling back to: {previous_tag}", "info")

        # Confirm rollback
        response = input(f"{Colors.YELLOW}⚠️  Confirm rollback? (yes/no): {Colors.RESET}")
        if response.lower() != "yes":
            self.log("  ❌ Rollback cancelled", "error")
            sys.exit(1)

        # Checkout previous tag
        self.run_command(["git", "checkout", previous_tag])

        # Redeploy previous version
        version = previous_tag.lstrip("v")
        self.log(f"  ✅ Rolled back to {previous_tag}", "success")
        self.log(f"  💡 Run 'cc release deploy production' to deploy this version", "info")


def main():
    """Main entry point for release CLI"""
    parser = argparse.ArgumentParser(
        description="🏯 AgencyOS Release Automation System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  cc release create 1.0.0              Create release v1.0.0
  cc release build                     Build Docker image + Python package
  cc release publish                   Publish to Docker Hub + PyPI
  cc release deploy staging            Deploy to staging
  cc release deploy production         Deploy to production
  cc release rollback                  Rollback to previous version
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Release commands")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create a new release")
    create_parser.add_argument("version", help="Version number (e.g., 1.0.0)")
    create_parser.add_argument("--no-tag", action="store_true", help="Don't create git tag")
    create_parser.add_argument("--no-changelog", action="store_true", help="Don't update changelog")

    # Build command
    build_parser = subparsers.add_parser("build", help="Build Docker image and Python package")
    build_parser.add_argument("--docker-only", action="store_true", help="Build Docker image only")
    build_parser.add_argument("--python-only", action="store_true", help="Build Python package only")
    build_parser.add_argument("--tag-latest", action="store_true", help="Tag Docker image as latest")

    # Publish command
    publish_parser = subparsers.add_parser("publish", help="Publish to registries")
    publish_parser.add_argument("--docker-only", action="store_true", help="Publish Docker image only")
    publish_parser.add_argument("--pypi-only", action="store_true", help="Publish to PyPI only")
    publish_parser.add_argument("--test-pypi", action="store_true", help="Publish to TestPyPI instead")
    publish_parser.add_argument("--push-latest", action="store_true", help="Push 'latest' Docker tag")

    # Deploy command
    deploy_parser = subparsers.add_parser("deploy", help="Deploy to environment")
    deploy_parser.add_argument("environment", choices=["staging", "production"], help="Target environment")
    deploy_parser.add_argument("--version", help="Specific version to deploy")

    # Rollback command
    rollback_parser = subparsers.add_parser("rollback", help="Rollback to previous version")

    args = parser.parse_args()

    # Get project root
    project_root = Path(__file__).parent.parent
    manager = ReleaseManager(project_root)

    try:
        if args.command == "create":
            # Validate version format
            if not manager.validate_version(args.version):
                manager.log(f"❌ Invalid version format: {args.version}", "error")
                manager.log("   Use semantic versioning: MAJOR.MINOR.PATCH (e.g., 1.0.0)", "info")
                sys.exit(1)

            manager.log(f"🚀 Creating release v{args.version}...", "header")

            # Update version files
            manager.update_version_files(args.version)

            # Generate and update changelog
            if not args.no_changelog:
                changelog_entry = manager.generate_changelog(args.version)
                manager.update_changelog(changelog_entry)

            # Commit changes
            manager.run_command(["git", "add", "."])
            manager.run_command(["git", "commit", "-m", f"chore: Release v{args.version}"])

            # Create git tag
            if not args.no_tag:
                manager.create_git_tag(args.version, f"Release v{args.version}")

            manager.log(f"\n✅ Release v{args.version} created!", "success")
            manager.log(f"💡 Next steps:", "info")
            manager.log(f"   1. Review changes: git show v{args.version}", "info")
            manager.log(f"   2. Push to remote: git push && git push --tags", "info")
            manager.log(f"   3. Build artifacts: cc release build", "info")
            manager.log(f"   4. Publish: cc release publish", "info")

        elif args.command == "build":
            manager.log("🔨 Building release artifacts...", "header")
            version = manager.get_current_version()

            if not args.python_only:
                manager.build_docker_image(version, tag_latest=args.tag_latest)

            if not args.docker_only:
                manager.build_python_package()

            manager.log("\n✅ Build complete!", "success")

        elif args.command == "publish":
            manager.log("📤 Publishing release...", "header")
            version = manager.get_current_version()

            if not args.pypi_only:
                manager.publish_docker_image(version, push_latest=args.push_latest)

            if not args.docker_only:
                manager.publish_pypi_package(test=args.test_pypi)

            manager.log("\n✅ Publish complete!", "success")

        elif args.command == "deploy":
            manager.deploy_to_environment(args.environment, args.version)

        elif args.command == "rollback":
            manager.rollback()

        else:
            parser.print_help()

    except KeyboardInterrupt:
        manager.log("\n\n⚠️  Operation cancelled by user", "warning")
        sys.exit(1)
    except Exception as e:
        manager.log(f"\n❌ Error: {e}", "error")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
