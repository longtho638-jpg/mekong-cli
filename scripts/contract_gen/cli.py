import argparse
import logging
import sys

from .generator import generate_contract
from .templates import TEMPLATES

# Colors (ANSI)
BOLD = "\033[1m"
CYAN = "\033[96m"
RED = "\033[91m"
RESET = "\033[0m"

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


def list_templates():
    """List available contract templates."""
    print(f"\n{BOLD}📜 AVAILABLE CONTRACT TEMPLATES{RESET}")
    print("=" * 60)
    print(f"{'Key':<15} | {'Price':<10} | {'Title'}")
    print("-" * 60)
    for key, template in TEMPLATES.items():
        print(f"{CYAN}{key:<15}{RESET} | {template.formatted_price:<10} | {template.title}")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="Contract Generator - Binh Pháp Venture Studio",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # List Command
    subparsers.add_parser("list", help="List available contract templates")

    # Generate Command
    gen_parser = subparsers.add_parser("generate", help="Generate a new contract")
    gen_parser.add_argument("template", help="Template key (e.g., ghost_cto, venture)")
    gen_parser.add_argument("email", help="Client email address to lookup in CRM")

    # Compatibility shim for old usage
    if len(sys.argv) > 1 and sys.argv[1] not in ["list", "generate", "-h", "--help"]:
        # Check if first arg is a known template key (legacy mode)
        if sys.argv[1] in TEMPLATES:
            args = argparse.Namespace(
                command="generate",
                template=sys.argv[1],
                email=sys.argv[2] if len(sys.argv) > 2 else None,
            )
            if not args.email:
                print(f"{RED}❌ Error: Email is required for legacy mode.{RESET}")
                print(f"Usage: {sys.argv[0]} {sys.argv[1]} <email>")
                sys.exit(1)
        else:
            args = parser.parse_args()
    else:
        args = parser.parse_args()

    if getattr(args, "command", None) == "list":
        list_templates()
    elif getattr(args, "command", None) == "generate":
        generate_contract(args.template, args.email)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
