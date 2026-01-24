"""
Test script for email service

Run this to verify email functionality works correctly
"""

from email_service import send_purchase_email, EmailService


def test_mock_email():
    """Test email service in mock mode"""
    print("\n" + "="*60)
    print("Testing Email Service (Mock Mode)")
    print("="*60)

    # Test data
    test_email = "customer@example.com"
    test_license = "BP-2026-ABCD-1234-EFGH-5678"
    test_product = "BizPlan Generator"

    # Send test email
    result = send_purchase_email(test_email, test_license, test_product)

    if result:
        print("\n✅ Email service test PASSED")
        print(f"   - Email would be sent to: {test_email}")
        print(f"   - License key: {test_license}")
        print(f"   - Product: {test_product}")
    else:
        print("\n❌ Email service test FAILED")

    return result


def test_custom_service():
    """Test email service with custom configuration"""
    print("\n" + "="*60)
    print("Testing Custom Email Service Configuration")
    print("="*60)

    # Create custom service instance
    service = EmailService(
        smtp_host="smtp.example.com",
        smtp_port=587,
        from_email="sales@binhphap.com",
        mock_mode=True
    )

    # Test data
    test_email = "vip.customer@example.com"
    test_license = "BP-2026-VIP-9999-PREMIUM-0001"
    test_product = "Enterprise License"

    # Send test email
    result = service.send_purchase_email(test_email, test_license, test_product)

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

    tests = [
        ("Mock Email", test_mock_email),
        ("Custom Service", test_custom_service),
    ]

    passed = 0
    failed = 0

    for test_name, test_func in tests:
        try:
            if test_func():
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


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
