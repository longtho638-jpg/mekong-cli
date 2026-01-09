"""
Tests for Content Marketing Strategy Generator.

Run: python3 -m pytest tests/test_content_marketing.py -v
"""

import sys
import os

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestContentMarketing:
    """Tests for ContentMarketingStrategy module."""
    
    def test_strategy_generation(self):
        """Test complete strategy generation."""
        from core.content_marketing import ContentMarketingStrategy
        
        gen = ContentMarketingStrategy()
        strategy = gen.generate_strategy("digital agency")
        
        assert strategy is not None
        assert strategy.business_type == "digital agency"
        assert strategy.created_at is not None
    
    def test_content_pillars(self):
        """Test content pillars generation."""
        from core.content_marketing import ContentMarketingStrategy
        
        gen = ContentMarketingStrategy()
        pillars = gen.generate_content_pillars("digital agency")
        
        assert len(pillars) >= 5
        assert all(p.name for p in pillars)
        assert all(p.description for p in pillars)
        assert all(len(p.topics) > 0 for p in pillars)
    
    def test_channel_strategy(self):
        """Test channel strategy generation."""
        from core.content_marketing import ContentMarketingStrategy, ContentChannel
        
        gen = ContentMarketingStrategy()
        strategy = gen.generate_channel_strategy("digital agency")
        
        assert len(strategy.channels) >= 4
        assert strategy.primary_channel is not None
        assert isinstance(strategy.primary_channel, ContentChannel)
        assert sum(strategy.distribution_weights.values()) > 99  # ~100%
    
    def test_content_calendar(self):
        """Test content calendar generation."""
        from core.content_marketing import ContentMarketingStrategy
        
        gen = ContentMarketingStrategy()
        calendar = gen.generate_content_calendar("digital agency")
        
        assert calendar.weeks == 4
        assert len(calendar.entries) > 0
        assert all(e.week >= 1 and e.week <= 4 for e in calendar.entries)
    
    def test_seo_keywords(self):
        """Test SEO keywords generation."""
        from core.content_marketing import ContentMarketingStrategy, SearchIntent
        
        gen = ContentMarketingStrategy()
        keywords = gen.generate_seo_keywords("digital agency")
        
        assert len(keywords) >= 5
        assert all(kw.keyword for kw in keywords)
        assert all(isinstance(kw.search_intent, SearchIntent) for kw in keywords)
    
    def test_performance_metrics(self):
        """Test performance metrics."""
        from core.content_marketing import ContentMarketingStrategy
        
        gen = ContentMarketingStrategy()
        metrics = gen.get_performance_metrics()
        
        assert metrics.engagement_rate_target > 0
        assert metrics.monthly_traffic_target > 0
        assert metrics.leads_per_month_target > 0
    
    def test_format_strategy(self):
        """Test strategy formatting."""
        from core.content_marketing import ContentMarketingStrategy
        
        gen = ContentMarketingStrategy()
        strategy = gen.generate_strategy("e-commerce blog")
        formatted = gen.format_strategy(strategy)
        
        assert "CONTENT MARKETING STRATEGY" in formatted
        assert "CONTENT PILLARS" in formatted
        assert "CHANNEL STRATEGY" in formatted
        assert "CONTENT CALENDAR" in formatted
        assert "SEO KEYWORDS" in formatted
        assert "PERFORMANCE METRICS" in formatted
    
    def test_different_business_types(self):
        """Test different business type templates."""
        from core.content_marketing import ContentMarketingStrategy
        
        gen = ContentMarketingStrategy()
        
        business_types = [
            "e-commerce blog",
            "B2B thought leadership",
            "local business social media",
            "digital agency"
        ]
        
        for biz in business_types:
            strategy = gen.generate_strategy(biz)
            assert strategy.business_type == biz
            assert len(strategy.pillars) >= 5


def run_all_tests():
    """Run all tests and print results."""
    print("🧪 Running Content Marketing Tests...")
    print("=" * 50)
    
    tests_passed = 0
    tests_failed = 0
    
    test_obj = TestContentMarketing()
    test_methods = [
        ("Strategy generation", test_obj.test_strategy_generation),
        ("Content pillars", test_obj.test_content_pillars),
        ("Channel strategy", test_obj.test_channel_strategy),
        ("Content calendar", test_obj.test_content_calendar),
        ("SEO keywords", test_obj.test_seo_keywords),
        ("Performance metrics", test_obj.test_performance_metrics),
        ("Format strategy", test_obj.test_format_strategy),
        ("Business types", test_obj.test_different_business_types),
    ]
    
    for name, test_func in test_methods:
        try:
            test_func()
            print(f"   ✅ {name}")
            tests_passed += 1
        except Exception as e:
            print(f"   ❌ {name}: {e}")
            tests_failed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Results: {tests_passed} passed, {tests_failed} failed")
    
    if tests_failed == 0:
        print("✅ ALL TESTS PASSED!")
    else:
        print("❌ SOME TESTS FAILED")
    
    return tests_failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
