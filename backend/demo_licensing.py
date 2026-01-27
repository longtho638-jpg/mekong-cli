#!/usr/bin/env python3
"""
License System Demo Script

Demonstrates license generation, validation, and expiration handling.
"""

from datetime import timedelta

from core.licensing import (
    LicenseGenerator,
    LicensePlan,
    LicenseStatus,
    LicenseValidator,
)


def print_separator():
    print("\n" + "=" * 70 + "\n")


def demo_generate_licenses():
    """Demonstrate license generation for different tiers"""
    print("📋 GENERATING LICENSES FOR DIFFERENT TIERS")
    print_separator()

    generator = LicenseGenerator()

    # Solo license
    solo_license = generator.generate("customer_solo_001", LicensePlan.SOLO, 365)
    print("✅ Solo License Generated:")
    print(f"   Key: {solo_license.license_key}")
    print(f"   Max Users: {solo_license.max_users}")
    print(f"   Max Agents: {solo_license.max_agents}")
    print(f"   Features: {', '.join(solo_license.features[:3])}...")

    # Team license
    team_license = generator.generate(
        "customer_team_001",
        LicensePlan.TEAM,
        365,
        bound_domain="team.example.com",
    )
    print("\n✅ Team License Generated:")
    print(f"   Key: {team_license.license_key}")
    print(f"   Max Users: {team_license.max_users}")
    print(f"   Max Agents: {team_license.max_agents}")
    print(f"   Bound Domain: {team_license.bound_domain}")

    # Enterprise license
    enterprise_license = generator.generate(
        "customer_enterprise_001", LicensePlan.ENTERPRISE, 365
    )
    print("\n✅ Enterprise License Generated:")
    print(f"   Key: {enterprise_license.license_key}")
    print(f"   Max Users: {enterprise_license.max_users}")
    print(f"   Max Agents: {enterprise_license.max_agents}")
    print(f"   Features: {len(enterprise_license.features)} total")

    return solo_license, team_license


def demo_validation(license, domain=None):
    """Demonstrate license validation"""
    print("🔍 VALIDATING LICENSES")
    print_separator()

    validator = LicenseValidator()

    # Basic validation
    result = validator.validate(license.license_key)
    print("Basic Validation:")
    print(f"   Valid: {result.valid}")
    print(f"   Reason: {result.reason}")

    # Full validation with license data
    result = validator.validate(
        license.license_key, domain=domain, license_data=license
    )
    print("\nFull Validation:")
    print(f"   Valid: {result.valid}")
    print(f"   Reason: {result.reason}")

    if result.valid:
        is_expired, days_remaining = validator.check_expiration(license)
        print(f"   Days Remaining: {days_remaining}")
        print(f"   Renewal Due: {validator.is_renewal_due(license)}")

    return result


def demo_invalid_scenarios():
    """Demonstrate invalid license scenarios"""
    print("❌ TESTING INVALID SCENARIOS")
    print_separator()

    validator = LicenseValidator()

    # Invalid format
    result = validator.validate("INVALID-LICENSE-KEY")
    print("Invalid Format:")
    print(f"   Valid: {result.valid}")
    print(f"   Reason: {result.reason}")

    # Invalid checksum
    result = validator.validate("AGY-test123-20260127-BADHASH")
    print("\nInvalid Checksum:")
    print(f"   Valid: {result.valid}")
    print(f"   Reason: {result.reason}")

    # Expired license
    generator = LicenseGenerator()
    expired = generator.generate("expired_customer", LicensePlan.SOLO, 1)
    expired.expires_at = expired.expires_at - timedelta(days=10)  # Force expiration

    result = validator.validate(expired.license_key, license_data=expired)
    print("\nExpired License:")
    print(f"   Valid: {result.valid}")
    print(f"   Reason: {result.reason}")

    # Revoked license
    revoked = generator.generate("revoked_customer", LicensePlan.SOLO, 365)
    revoked.status = LicenseStatus.REVOKED

    result = validator.validate(revoked.license_key, license_data=revoked)
    print("\nRevoked License:")
    print(f"   Valid: {result.valid}")
    print(f"   Reason: {result.reason}")


def demo_domain_binding():
    """Demonstrate domain binding"""
    print("🔗 TESTING DOMAIN BINDING")
    print_separator()

    generator = LicenseGenerator()
    validator = LicenseValidator()

    # Create license bound to specific domain
    license = generator.generate(
        "bound_customer", LicensePlan.TEAM, 365, bound_domain="example.com"
    )

    print(f"License bound to: {license.bound_domain}")

    # Valid domain
    result = validator.validate(
        license.license_key, domain="example.com", license_data=license
    )
    print("\nValidation with correct domain (example.com):")
    print(f"   Valid: {result.valid}")

    # Invalid domain
    result = validator.validate(
        license.license_key, domain="wrong.com", license_data=license
    )
    print("\nValidation with wrong domain (wrong.com):")
    print(f"   Valid: {result.valid}")
    print(f"   Reason: {result.reason}")


def demo_renewal():
    """Demonstrate license renewal"""
    print("♻️  TESTING LICENSE RENEWAL")
    print_separator()

    generator = LicenseGenerator()
    validator = LicenseValidator()

    # Create original license
    original = generator.generate("renewal_customer", LicensePlan.TEAM, 30)
    print("Original License:")
    print(f"   Key: {original.license_key}")
    print(f"   Expires: {original.expires_at.strftime('%Y-%m-%d')}")

    # Check if renewal is due
    is_due = validator.is_renewal_due(original, warning_days=30)
    print(f"   Renewal Due (30-day warning): {is_due}")

    # Renew license
    renewed = generator.regenerate_with_same_checksum(original)
    print("\nRenewed License:")
    print(f"   Key: {renewed.license_key}")
    print(f"   Expires: {renewed.expires_at.strftime('%Y-%m-%d')}")

    # Extract checksums
    orig_checksum = original.license_key.split("-")[3]
    renew_checksum = renewed.license_key.split("-")[3]

    print(f"\nChecksum Preserved: {orig_checksum == renew_checksum}")


def main():
    """Run all demos"""
    print("\n" + "🏯 " * 20)
    print("🏯 AGENCYOS LICENSE SYSTEM DEMO")
    print("🏯 " * 20)

    # 1. Generate licenses
    solo_license, team_license = demo_generate_licenses()

    # 2. Validate licenses
    demo_validation(solo_license)

    # 3. Test invalid scenarios
    demo_invalid_scenarios()

    # 4. Test domain binding
    demo_domain_binding()

    # 5. Test renewal
    demo_renewal()

    print_separator()
    print("✅ DEMO COMPLETE!")
    print("📚 See docs/LICENSE_SYSTEM.md for full documentation")
    print("\n" + "🏯 " * 20 + "\n")


if __name__ == "__main__":
    main()
