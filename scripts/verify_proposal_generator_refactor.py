"""
Verification script for Proposal Generator Refactor.
"""
import logging
import os
import shutil
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.getcwd())

# Configure logging
logging.basicConfig(level=logging.INFO)

from antigravity.core.money_maker import MoneyMaker, ServiceTier
from antigravity.core.proposal_generator import Proposal, ProposalGenerator


def verify_proposal_generator():
    print("Testing Proposal Generator Refactor...")

    # Setup
    output_dir = "temp_proposals_test"
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)

    pg = ProposalGenerator()
    MoneyMaker()

    # 1. Test Quick Launch (Integration with MoneyMaker)
    print("\n1. Testing Quick Launch...")
    proposal = pg.quick_launch(
        client_name="Refactor Corp",
        contact="Mr. Code",
        chapter_ids=[1, 2, 5], # Strategy, Runway, Growth
        tier=ServiceTier.WARRIOR
    )

    if proposal.client_name != "Refactor Corp":
        print(f"❌ Client name mismatch: {proposal.client_name}")
        return False

    if "Refactor Corp" not in proposal.markdown_content:
        print("❌ Client name missing from markdown")
        return False

    if "WIN-WIN-WIN Alignment Check" not in proposal.markdown_content:
        print("❌ WIN-WIN-WIN section missing")
        return False

    print(f"   Proposal #{proposal.id} generated via Quick Launch ✅")

    # 2. Test Content Structure
    print("\n2. Testing Content Structure...")
    # Check for table generation
    if "| Module | Dịch Vụ |" not in proposal.markdown_content:
        print("❌ Service table header missing")
        return False

    # Check for pricing
    if "Đầu Tư Ban Đầu" not in proposal.markdown_content:
        print("❌ Investment section missing")
        return False

    print("   Content structure verified ✅")

    # 3. Test File Export
    print("\n3. Testing File Export...")
    file_path = pg.save_to_file(proposal, output_dir=output_dir)

    if not file_path.exists():
        print(f"❌ Exported file not found at {file_path}")
        return False

    content = file_path.read_text(encoding="utf-8")
    if len(content) < 100:
        print("❌ Exported file content seems too short")
        return False

    print(f"   File exported to {file_path} ✅")

    # 4. Test Stats
    print("\n4. Testing Stats...")
    stats = pg.get_stats()

    if stats["volume"] != 1:
        print(f"❌ Volume stats mismatch: {stats['volume']}")
        return False

    if stats["pipeline_value_usd"] <= 0:
        print("❌ Pipeline value should be positive")
        return False

    print("   Stats verified ✅")

    # Cleanup
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_proposal_generator():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
