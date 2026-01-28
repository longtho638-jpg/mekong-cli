"""
Test script for email service

Run this to verify email functionality works correctly
"""
import asyncio
import pytest
from backend.services.email_service import email_service, EmailService


@pytest.mark.asyncio
async def test_mock_email():
    """Test email service in mock mode"""
    print("\n" + "="*60)
    print("Testing Email Service (Mock Mode)")
    print("="*60)

    # Test data
    test_email = "customer@example.com"
    test_license = "BP-2026-ABCD-1234-EFGH-5678"
    test_product = "BizPlan Generator"

    # Send test email
    result = await email_service.send_purchase_email(test_email, test_license, test_product)

    if result:
        print("\n✅ Email service test PASSED")
        print(f"   - Email would be sent to: {test_email}")
        print(f"   - License key: {test_license}")
        print(f"   - Product: {test_product}")
    else:
        print("\n❌ Email service test FAILED")

    return result


@pytest.mark.asyncio
async def test_custom_service():
    """Test email service with custom configuration"""
    print("\n" + "="*60)
    print("Testing Custom Email Service Configuration")
    print("="*60)

    # Create custom service instance
    service = EmailService()
    # Mock settings or configure manually if needed,
    # but EmailService init reads from settings.
    # We can inject a provider manually for testing if needed.
    # For now, let's assume it picks up defaults or mock settings.

    # Test data
    test_email = "vip.customer@example.com"
    test_license = "BP-2026-VIP-9999-PREMIUM-0001"
    test_product = "Enterprise License"

    # Send test email
    result = await service.send_purchase_email(test_email, test_license, test_product)

    if result:
        print("\n✅ Custom service test PASSED")
    else:
        print("\n❌ Custom service test FAILED")

    return result


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("EMAIL SERVICE TEST SUITE")
    print("="*60)

    # Helper to run async tests synchronously
    async def run_tests():
        tests = [
            ("Mock Email", test_mock_email),
            ("Custom Service", test_custom_service),
        ]

        passed = 0
        failed = 0

        for test_name, test_func in tests:
            try:
                if await test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"\n❌ {test_name} test FAILED with exception: {e}")
                failed += 1

        # Summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Total: {passed + failed}")
        print("="*60 + "\n")

        return failed == 0

    success = asyncio.run(run_tests())
    return success


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
