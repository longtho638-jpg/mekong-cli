"""
🧪 Test Refactored Core Modules
================================

Simple test script để verify refactored modules hoạt động correctly.
"""

import os
import sys

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


def test_ai_wingman():
    """Test AI Wingman refactored."""
    print("🤖 Testing AI Wingman Refactored...")

    try:
        from core.agents.wingman import AgencyOwnerProfile, AIWingman, WingmanMode

        # Create owner profile
        owner = AgencyOwnerProfile(
            name="Alex",
            agency_name="Nova Digital",
            services=["SEO", "Content Marketing", "PPC Ads"],
        )

        # Initialize AI Wingman
        wingman = AIWingman(owner, mode=WingmanMode.SEMI_AUTO)

        # Test inquiry handling
        result = wingman.handle_inquiry(
            client_name="John Smith",
            client_email="john@example.com",
            service="SEO",
            message="Need help with ranking",
        )

        print(f"✅ Inquiry handled: {result['action_taken']}")

        # Test proposal generation
        proposal = wingman.generate_proposal(
            client_name="John Smith",
            project_name="SEO Project",
            project_description="Complete SEO optimization",
            services=["Technical SEO", "Content Strategy"],
            setup_fee=1500,
            monthly_fee=500,
        )

        print(f"✅ Proposal generated: {len(proposal)} characters")

        # Test daily summary
        summary = wingman.get_daily_summary()
        print(f"✅ Daily summary: {summary['total_notifications']} notifications")

        print("✅ AI Wingman refactored working correctly!\n")

    except Exception as e:
        print(f"❌ AI Wingman test failed: {e}\n")
        assert False, f"AI Wingman test failed: {e}"


def test_client_portal():
    """Test Client Portal refactored."""
    print("👥 Testing Client Portal Refactored...")

    try:
        from core.portal.client_portal import ClientPortal

        # Initialize portal
        portal = ClientPortal("Test Agency")

        # Test adding client
        client = portal.add_client(
            name="Jane Doe", email="jane@example.com", company="Test Corp", monthly_retainer=2000.0
        )

        print(f"✅ Client added: {client.company}")

        # Test creating project
        project = portal.create_project(
            client_id=client.id,
            name="Website Redesign",
            description="Complete website overhaul",
            budget=5000.0,
        )

        print(f"✅ Project created: {project.name}")

        # Test adding task
        task = portal.add_task(
            project_id=project.id,
            name="Design Homepage",
            description="Create responsive homepage design",
            status="TODO",
        )

        print(f"✅ Task added: {task.name if task else 'None'}")

        # Test invoice creation
        invoice = portal.create_invoice(
            client_id=client.id, amount=2500.0, items=[{"name": "Phase 1", "amount": 2500.0}]
        )

        print(f"✅ Invoice created: {invoice.id}")

        # Test message sending
        message_sent = portal.send_message(
            client_id=client.id, content="Your project is ready for review!"
        )

        print(f"✅ Message sent: {message_sent}")

        # Test formatting
        summary = portal.format_client_summary(client.id)
        print(f"✅ Client summary formatted: {len(summary)} characters")

        print("✅ Client Portal refactored working correctly!\n")

    except Exception as e:
        print(f"❌ Client Portal test failed: {e}\n")
        assert False, f"Client Portal test failed: {e}"


def test_analytics():
    """Test Analytics refactored."""
    print("📊 Testing Analytics Refactored...")

    try:
        from core.analytics.dashboard import AnalyticsDashboard
        from core.services.analytics.models import MetricPeriod

        # Initialize dashboard
        dashboard = AnalyticsDashboard("Test Agency", demo_mode=True)

        # Test revenue calculation
        revenue = dashboard.get_revenue(MetricPeriod.MONTH)
        print(f"✅ Revenue calculated: ${revenue['total']:,.2f}")

        # Test MRR
        mrr = dashboard.get_mrr()
        print(f"✅ MRR calculated: ${mrr['mrr']:,.2f}")

        # Test client overview
        client_overview = dashboard.get_client_overview()
        print(f"✅ Client overview: {client_overview['total_clients']} clients")

        # Test forecast
        forecast = dashboard.get_revenue_forecast(3)
        print(f"✅ Forecast generated: {len(forecast)} months")

        # Test dashboard formatting
        dashboard_text = dashboard.format_dashboard_text()
        print(f"✅ Dashboard formatted: {len(dashboard_text)} characters")

        print("✅ Analytics refactored working correctly!\n")

    except Exception as e:
        print(f"❌ Analytics test failed: {e}\n")
        assert False, f"Analytics test failed: {e}"


def main():
    """Run all tests."""
    print("🧪 Testing Refactored Core Modules")
    print("=" * 50)

    results = []

    # Test each module
    results.append(test_ai_wingman())
    results.append(test_client_portal())
    results.append(test_analytics())

    # Summary
    passed = sum(results)
    total = len(results)

    print("=" * 50)
    print(f"🎯 Test Results: {passed}/{total} passed")

    if passed == total:
        print("🎉 All refactored modules working correctly!")
        return True
    else:
        print("⚠️  Some modules have issues. Check logs above.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
