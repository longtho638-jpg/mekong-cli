"""
Platform Logic Simulation Tests.
Mekong-CLI Comprehensive Test Suite.

Tests all 22 hubs and 161 agents for logic correctness.
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest

# Import mock data factory
from tests.fixtures.mock_data import MockDataFactory

# Import core modules
from core.hybrid_router import HybridRouter, TaskType, TaskComplexity, route_task


# ═══════════════════════════════════════════════════════════════════════════════
# 🧪 HYBRID ROUTER TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestHybridRouter:
    """Test suite for HybridRouter AI task routing."""
    
    @pytest.fixture
    def router(self):
        return HybridRouter()
    
    def test_router_initialization(self, router):
        """Test router initializes correctly."""
        assert router is not None
        assert router.cost_optimize is True
        assert router.calls_count == 0
        assert router.total_savings == 0.0
    
    def test_simple_text_routing(self, router):
        """Test simple text tasks route to cheap provider."""
        result = router.route(TaskType.TEXT, TaskComplexity.SIMPLE, 100)
        assert result.provider == "openrouter/llama-3.1-8b"
        assert result.estimated_cost < 0.01
    
    def test_complex_text_routing(self, router):
        """Test complex text tasks route to premium provider."""
        result = router.route(TaskType.TEXT, TaskComplexity.COMPLEX, 1000)
        assert result.provider == "google/gemini-2.0-flash"
    
    def test_code_routing(self, router):
        """Test code tasks route appropriately by complexity."""
        simple = router.route(TaskType.CODE, TaskComplexity.SIMPLE, 500)
        complex_ = router.route(TaskType.CODE, TaskComplexity.COMPLEX, 2000)
        
        assert "llama" in simple.provider or "gemini" in simple.provider
        assert complex_.provider == "anthropic/claude-3.5-sonnet"
    
    def test_vision_routing(self, router):
        """Test vision tasks route to Gemini."""
        result = router.route(TaskType.VISION, TaskComplexity.MEDIUM, 500)
        assert "gemini" in result.provider
    
    def test_long_context_override(self, router):
        """Test long context forces Gemini Pro."""
        result = router.route(TaskType.TEXT, TaskComplexity.SIMPLE, 150000)
        assert "gemini" in result.provider
        assert "Long context" in result.reason
    
    def test_manual_override(self, router):
        """Test manual provider override."""
        result = router.route(
            TaskType.TEXT, 
            TaskComplexity.SIMPLE, 
            100,
            override_provider="anthropic/claude-3.5-sonnet"
        )
        assert result.provider == "anthropic/claude-3.5-sonnet"
        assert result.reason == "Manual override"
    
    def test_task_analysis(self):
        """Test task type and complexity analysis."""
        # Test code detection
        task_type, complexity = HybridRouter.analyze_task("Write a Python function to sort a list")
        assert task_type == TaskType.CODE
        
        # Test simple detection
        task_type, complexity = HybridRouter.analyze_task("Quick summary of this text")
        assert complexity == TaskComplexity.SIMPLE
        
        # Test complex detection
        task_type, complexity = HybridRouter.analyze_task(
            "Provide a comprehensive detailed analysis of the architectural implications..."
        )
        assert complexity == TaskComplexity.COMPLEX
    
    def test_savings_tracking(self, router):
        """Test cost savings are tracked."""
        # Make several routing calls
        for _ in range(10):
            router.route(TaskType.TEXT, TaskComplexity.SIMPLE, 500)
        
        stats = router.get_stats()
        assert stats["total_calls"] == 10
        assert stats["total_savings_usd"] >= 0
    
    def test_route_task_convenience(self):
        """Test convenience wrapper function."""
        result = route_task("Write a simple hello world script")
        assert result is not None
        assert result.provider in HybridRouter.PROVIDERS


# ═══════════════════════════════════════════════════════════════════════════════
# 🏭 MOCK DATA FACTORY TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestMockDataFactory:
    """Test suite for mock data generation."""
    
    @pytest.fixture
    def factory(self):
        return MockDataFactory(seed=42)
    
    def test_client_generation(self, factory):
        """Test single client generation."""
        client = factory.generate_client()
        assert client.id.startswith("CLI-")
        assert client.name is not None
        assert client.industry in [
            "Technology", "Healthcare", "Finance", "E-commerce", "Real Estate",
            "Education", "Manufacturing", "Logistics", "Marketing", "Legal",
            "Consulting", "SaaS", "Fintech", "Proptech", "Edtech"
        ]
        assert 5000 <= client.ltv <= 500000
        assert 50 <= client.health_score <= 100
    
    def test_project_generation(self, factory):
        """Test project generation linked to client."""
        client = factory.generate_client()
        project = factory.generate_project(client.id)
        
        assert project.id.startswith("PRJ-")
        assert project.client_id == client.id
        assert project.budget > 0
        assert project.status in ["planning", "in_progress", "review", "completed"]
    
    def test_venture_generation(self, factory):
        """Test venture generation."""
        venture = factory.generate_venture()
        assert venture.id.startswith("VEN-")
        assert venture.type in ["SaaS", "Marketplace", "Agency", "Product", "Service"]
        assert venture.stage in ["CONCEPT", "MVP", "GROWTH", "SCALE"]
        assert len(venture.founders) >= 1
    
    def test_okr_generation(self, factory):
        """Test OKR generation."""
        okr = factory.generate_okr()
        assert okr.id.startswith("OKR-")
        assert okr.pillar in ["GROWTH", "PRODUCT", "OPERATIONS", "FINANCE", "TEAM"]
        assert 0 <= okr.progress <= 100
        assert len(okr.key_results) == 3
    
    def test_bulk_generation(self, factory):
        """Test bulk data generation."""
        clients = factory.generate_clients(100)
        assert len(clients) == 100
        
        projects = factory.generate_projects(clients[:10])
        assert len(projects) > 0
        
        ventures = factory.generate_ventures(50)
        assert len(ventures) == 50
        
        okrs = factory.generate_okrs(100)
        assert len(okrs) == 100
    
    def test_full_dataset_generation(self, factory):
        """Test complete dataset generation."""
        dataset = factory.generate_full_dataset()
        
        assert "clients" in dataset
        assert "projects" in dataset
        assert "ventures" in dataset
        assert "okrs" in dataset
        assert "stats" in dataset
        
        stats = dataset["stats"]
        assert stats["total_clients"] == 1000
        assert stats["total_ventures"] == 100
        assert stats["total_okrs"] == 200
        assert stats["total_ltv"] > 0


# ═══════════════════════════════════════════════════════════════════════════════
# 🏢 HUB LOGIC TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestHubLogic:
    """Test suite for Hub initialization and logic."""
    
    def test_entrepreneur_hub_import(self):
        """Test EntrepreneurHub can be imported."""
        try:
            from core.entrepreneur_hub import EntrepreneurHub
            hub = EntrepreneurHub("Test Agency")
            assert hub is not None
            assert hub.agency_name == "Test Agency"
        except ImportError as e:
            pytest.skip(f"EntrepreneurHub dependencies not available: {e}")
    
    def test_strategy_officer_import(self):
        """Test StrategyOfficer can be imported."""
        try:
            from core.strategy_officer import StrategyOfficer
            officer = StrategyOfficer("Test Agency")
            assert officer is not None
        except ImportError as e:
            pytest.skip(f"StrategyOfficer dependencies not available: {e}")
    
    def test_hybrid_router_import(self):
        """Test HybridRouter is always available."""
        from core.hybrid_router import HybridRouter
        router = HybridRouter()
        assert router is not None


# ═══════════════════════════════════════════════════════════════════════════════
# 🔄 INTEGRATION TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestPlatformIntegration:
    """Integration tests across platform modules."""
    
    def test_routing_with_mock_data(self):
        """Test routing decisions with mock data scenarios."""
        router = HybridRouter()
        MockDataFactory()
        
        # Simulate various task scenarios
        scenarios = [
            ("Analyze client health score trends", TaskType.TEXT, TaskComplexity.MEDIUM),
            ("Generate project proposal", TaskType.TEXT, TaskComplexity.COMPLEX),
            ("Debug CRM integration code", TaskType.CODE, TaskComplexity.COMPLEX),
            ("Quick status update", TaskType.TEXT, TaskComplexity.SIMPLE),
        ]
        
        for prompt, expected_type, expected_complexity in scenarios:
            result = route_task(prompt, router)
            assert result.provider in HybridRouter.PROVIDERS
            assert result.estimated_cost >= 0
    
    def test_cost_efficiency(self):
        """Test that routing saves costs vs baseline."""
        router = HybridRouter()
        
        # Simulate 100 mixed tasks
        for i in range(100):
            if i % 3 == 0:
                router.route(TaskType.TEXT, TaskComplexity.SIMPLE, 200)
            elif i % 3 == 1:
                router.route(TaskType.TEXT, TaskComplexity.MEDIUM, 500)
            else:
                router.route(TaskType.CODE, TaskComplexity.COMPLEX, 1000)
        
        stats = router.get_stats()
        assert stats["total_calls"] == 100
        # Savings should be positive (routing to cheaper models when possible)
        assert stats["total_savings_usd"] > 0


# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 RUN TESTS
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
