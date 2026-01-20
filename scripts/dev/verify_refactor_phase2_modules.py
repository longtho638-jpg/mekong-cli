
import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).parent.parent.parent))

def test_imports():
    print("🔍 Testing modular imports and proxies...")

    try:
        from core.repositories.client_portal import ClientPortalRepository
        ClientPortalRepository()
        print("✅ ClientPortalRepository (New) imported and initialized")

        from core.repositories.client_portal_repository import (
            ClientPortalRepository as ClientPortalProxy,
        )
        ClientPortalProxy()
        print("✅ ClientPortalRepository (Proxy) imported and initialized")
    except Exception as e:
        print(f"❌ ClientPortalRepository failed: {e}")

    try:
        from core.repositories.analytics import AnalyticsRepository
        AnalyticsRepository()
        print("✅ AnalyticsRepository (New) imported and initialized")

        from core.repositories.analytics_repository import AnalyticsRepository as AnalyticsProxy
        AnalyticsProxy()
        print("✅ AnalyticsRepository (Proxy) imported and initialized")
    except Exception as e:
        print(f"❌ AnalyticsRepository failed: {e}")

    try:
        from core.hr.career import CareerDevelopment
        CareerDevelopment("Test Agency")
        print("✅ CareerDevelopment (New) imported and initialized")

        from core.hr.career_development import CareerDevelopment as CareerProxy
        CareerProxy("Test Agency")
        print("✅ CareerDevelopment (Proxy) imported and initialized")
    except Exception as e:
        print(f"❌ CareerDevelopment failed: {e}")

    try:
        from core.finance.investor import InvestorRelations
        InvestorRelations("Test Agency")
        print("✅ InvestorRelations (New) imported and initialized")

        from core.finance.investor_relations import InvestorRelations as InvestorProxy
        InvestorProxy("Test Agency")
        print("✅ InvestorRelations (Proxy) imported and initialized")
    except Exception as e:
        print(f"❌ InvestorRelations failed: {e}")

    try:
        from core.ops.network_opt import NetworkOptimizer
        NetworkOptimizer()
        print("✅ NetworkOptimizer (New) imported and initialized")

        from core.ops.network import NetworkOptimizer as NetworkProxy
        NetworkProxy()
        print("✅ NetworkOptimizer (Proxy) imported and initialized")
    except Exception as e:
        print(f"❌ NetworkOptimizer failed: {e}")

    try:
        from core.services.analytics import AnalyticsCalculationEngine
        AnalyticsCalculationEngine()
        print("✅ AnalyticsCalculationEngine (New) imported and initialized")

        from core.services.analytics_service import (
            AnalyticsCalculationEngine as AnalyticsServiceProxy,
        )
        AnalyticsServiceProxy()
        print("✅ AnalyticsService (Proxy) imported and initialized")
    except Exception as e:
        print(f"❌ AnalyticsService failed: {e}")

    try:
        from core.hr.recruiting import TalentAcquisition
        TalentAcquisition("Test Agency")
        print("✅ TalentAcquisition (New) imported and initialized")

        from core.hr.talent_acquisition import TalentAcquisition as TalentProxy
        TalentProxy("Test Agency")
        print("✅ TalentAcquisition (Proxy) imported and initialized")
    except Exception as e:
        print(f"❌ TalentAcquisition failed: {e}")

    try:
        from core.modules.content import ContentGenerator
        ContentGenerator("Test", "Niche", "Loc", "Skill")
        print("✅ ContentGenerator (New) imported and initialized")

        from core.modules.content.services import ContentGenerator as ContentProxy
        ContentProxy("Test", "Niche", "Loc", "Skill")
        print("✅ ContentGenerator (Proxy) imported and initialized")
    except Exception as e:
        print(f"❌ ContentGenerator failed: {e}")

    try:
        from core.finance.term_sheet_opt import TermSheetAnalyzer
        TermSheetAnalyzer("Test Agency")
        print("✅ TermSheetAnalyzer (New) imported and initialized")

        from core.finance.term_sheet import TermSheetAnalyzer as TermSheetProxy
        TermSheetProxy("Test Agency")
        print("✅ TermSheetAnalyzer (Proxy) imported and initialized")
    except Exception as e:
        print(f"❌ TermSheetAnalyzer failed: {e}")

    try:
        from core.memory.system import Memory
        Memory()
        print("✅ Memory (New) imported and initialized")

        from core.memory.memory import Memory as MemoryProxy
        MemoryProxy()
        print("✅ Memory (Proxy) imported and initialized")
    except Exception as e:
        print(f"❌ Memory failed: {e}")

if __name__ == "__main__":
    test_imports()
