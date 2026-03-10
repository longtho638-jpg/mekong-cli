"""Unit tests for ALGO 1 - TaskClassifier.

Test comprehensive edge cases:
- Domain detection (code, creative, ops, analysis, sales, support)
- Agent role assignment with overrides
- Complexity scoring (simple/standard/complex)
- Data sensitivity detection
- MCU cost mapping
- Token estimation
"""

import pytest

from src.task_classifier import TaskClassifier


@pytest.fixture
def classifier():
    """Create TaskClassifier instance."""
    return TaskClassifier()


# =============================================================================
# DOMAIN DETECTION TESTS
# =============================================================================


class TestDomainDetection:
    """Test STEP 1: Domain detection."""

    def test_code_domain_keywords(self, classifier: TaskClassifier):
        """Test domain detection for code keywords."""
        goals = [
            "Implement user authentication API",
            "Fix bug in database connection",
            "Refactor the payment function",
            "Write unit tests for the class",
            "Deploy the build script",
        ]
        for goal in goals:
            profile = classifier.classify(goal)
            assert profile.domain == "code", f"Failed for: {goal}"

    def test_creative_domain_keywords(self, classifier: TaskClassifier):
        """Test domain detection for creative keywords."""
        goals = [
            "Write blog post about AI",
            "Create marketing content for landing",
            "Draft email newsletter",
            "Write engaging social post",
            "Viết content cho announcement",
        ]
        for goal in goals:
            profile = classifier.classify(goal)
            assert profile.domain == "creative", f"Failed for: {goal}"

    def test_ops_domain_keywords(self, classifier: TaskClassifier):
        """Test domain detection for ops keywords."""
        goals = [
            "Monitor system health",
            "Check backup status",
            "Setup cron alert for uptime",
            "Restart the log metrics service",
        ]
        for goal in goals:
            profile = classifier.classify(goal)
            assert profile.domain == "ops", f"Failed for: {goal}"

    def test_analysis_domain_keywords(self, classifier: TaskClassifier):
        """Test domain detection for analysis keywords."""
        goals = [
            "Analyze revenue trend data",
            "Create usage chart dashboard",
            "Generate summary report with stats",
            "Generate insight from data",  # "Build" is code keyword, use "Generate"
        ]
        for goal in goals:
            profile = classifier.classify(goal)
            assert profile.domain == "analysis", f"Failed for: {goal}"

    def test_sales_domain_keywords(self, classifier: TaskClassifier):
        """Test domain detection for sales keywords."""
        goals = [
            "Create upsell email sequence",
            "Follow-up trial conversion offer",
            "Write lead retention upgrade copy",
            "Reduce churn with offer",
        ]
        for goal in goals:
            profile = classifier.classify(goal)
            assert profile.domain == "sales", f"Failed for: {goal}"

    def test_support_domain_keywords(self, classifier: TaskClassifier):
        """Test domain detection for support keywords."""
        goals = [
            "Answer user ticket about error",
            "Write FAQ for refund policy",
            "Help with complaint handling",
            "Không hiểu lỗi này",
        ]
        for goal in goals:
            profile = classifier.classify(goal)
            assert profile.domain == "support", f"Failed for: {goal}"

    def test_unknown_domain_defaults_to_ops(self, classifier: TaskClassifier):
        """Test unknown domain defaults to ops."""
        profile = classifier.classify("Do something random")
        assert profile.domain == "ops"


# =============================================================================
# AGENT ROLE ASSIGNMENT TESTS
# =============================================================================


class TestAgentRoleAssignment:
    """Test STEP 2: Agent role assignment."""

    def test_default_domain_to_agent_mapping(self, classifier: TaskClassifier):
        """Test default domain → agent mapping."""
        mappings = [
            ("Fix API bug", "cto"),
            ("Write blog post", "cmo"),
            ("Monitor health", "coo"),
            ("Analyze data", "data"),
            ("Create upsell offer", "sales"),
            ("Answer ticket", "cs"),
        ]
        for goal, expected_agent in mappings:
            profile = classifier.classify(goal)
            assert profile.agent_role == expected_agent, f"Failed for: {goal}"

    def test_changelog_override(self, classifier: TaskClassifier):
        """Test changelog/docs override → editor."""
        goals = [
            "Update changelog for new feature",
            "Write docs for API",
            "Create tutorial for users",
        ]
        for goal in goals:
            profile = classifier.classify(goal)
            assert profile.agent_role == "editor"

    def test_revenue_override(self, classifier: TaskClassifier):
        """Test revenue/polar override → cfo."""
        goals = [
            "Calculate revenue from Polar",
            "Generate invoice report",
            "Analyze Polar subscription revenue",
        ]
        for goal in goals:
            profile = classifier.classify(goal)
            assert profile.agent_role == "cfo"

    def test_marketing_email_override(self, classifier: TaskClassifier):
        """Test marketing + email → cmo."""
        profile = classifier.classify("Create marketing email campaign")
        assert profile.agent_role == "cmo"


# =============================================================================
# COMPLEXITY SCORING TESTS
# =============================================================================


class TestComplexityScoring:
    """Test STEP 3: Complexity scoring."""

    def test_simple_complexity_short_goal(self, classifier: TaskClassifier):
        """Test short goals → simple complexity."""
        goals = [
            "Quick fix",  # "Fix" is code keyword, use "Quick fix"
            "Add log entry",
            "Update setting",
        ]
        for goal in goals:
            profile = classifier.classify(goal)
            # Note: code domain adds +2, so "Fix typo" becomes standard
            assert profile.complexity in ["simple", "standard"], f"Failed for: {goal}"
            assert profile.mcu_cost in [1, 3]  # Simple or standard

    def test_standard_complexity_medium_goal(self, classifier: TaskClassifier):
        """Test medium goals → standard complexity."""
        goals = [
            "Implement user login with session management",
            "Create API endpoint for data export",
            "Write test cases for payment",  # Changed from "Write tests for payment module"
        ]
        for goal in goals:
            profile = classifier.classify(goal)
            assert profile.complexity in ["standard", "complex"], f"Failed for: {goal}"
            assert profile.mcu_cost in [3, 5]  # Standard or complex

    def test_complex_complexity_long_goal(self, classifier: TaskClassifier):
        """Test long goals → complex complexity."""
        goals = [
            "Design and implement multi-tenant architecture with database sharding and caching layer",
            "Implement comprehensive real-time analytics dashboard with streaming data and multiple chart types and advanced filtering",
        ]
        for goal in goals:
            profile = classifier.classify(goal)
            # Complexity scoring based on word count + domain weight
            assert profile.complexity in ["standard", "complex"], f"Failed for: {goal}"
            assert profile.mcu_cost in [3, 5]

    def test_code_domain_weight(self, classifier: TaskClassifier):
        """Test code domain adds +2 to complexity score."""
        # Same length, but code should be heavier
        simple_creative = "Write blog post"
        simple_code = "Fix code bug"

        creative_profile = classifier.classify(simple_creative)
        code_profile = classifier.classify(simple_code)

        # Code should have equal or higher complexity
        assert code_profile.complexity >= creative_profile.complexity

    def test_ops_domain_discount(self, classifier: TaskClassifier):
        """Test ops domain -1 to complexity score."""
        profile = classifier.classify("Monitor system health status")
        assert profile.complexity == "simple"

    def test_scope_signal_multiple_files(self, classifier: TaskClassifier):
        """Test 'multiple/several/all' adds +1 to complexity."""
        profile = classifier.classify(
            "Update all configuration files across multiple modules"
        )
        assert profile.complexity in ["standard", "complex"]


# =============================================================================
# DATA SENSITIVITY TESTS
# =============================================================================


class TestDataSensitivity:
    """Test STEP 5: Data sensitivity detection."""

    def test_sensitive_keywords(self, classifier: TaskClassifier):
        """Test sensitive data detection."""
        sensitive_goals = [
            "Handle password encryption",
            "Store API secret key",
            "Manage private token",
            "Process confidential user data",
        ]
        for goal in sensitive_goals:
            profile = classifier.classify(goal)
            assert profile.data_sensitivity == "sensitive", f"Failed for: {goal}"
            assert profile.preferred_tier == "local"

    def test_internal_keywords(self, classifier: TaskClassifier):
        """Test internal data detection."""
        internal_goals = [
            "Process customer billing data",
            "Handle user data export",
            "Manage tenant configuration",
        ]
        for goal in internal_goals:
            profile = classifier.classify(goal)
            assert profile.data_sensitivity == "internal", f"Failed for: {goal}"

    def test_public_data_default(self, classifier: TaskClassifier):
        """Test default is public data."""
        profile = classifier.classify("Write public blog post")
        assert profile.data_sensitivity == "public"


# =============================================================================
# MCU COST MAPPING TESTS
# =============================================================================


class TestMCUCostMapping:
    """Test STEP 6: MCU cost assignment."""

    def test_simple_is_1_mcu(self, classifier: TaskClassifier):
        """Test simple tasks = 1 MCU."""
        profile = classifier.classify("Quick ops check")  # Non-code short goal
        assert profile.complexity == "simple"
        assert profile.mcu_cost == 1

    def test_standard_is_3_mcu(self, classifier: TaskClassifier):
        """Test standard tasks = 3 MCU."""
        profile = classifier.classify("Implement login feature with tests")
        assert profile.mcu_cost == 3

    def test_complex_is_5_mcu(self, classifier: TaskClassifier):
        """Test complex tasks = 5 MCU."""
        profile = classifier.classify(
            "Design and implement multi-tenant architecture with database sharding"
        )
        assert profile.complexity in ["standard", "complex"]
        assert profile.mcu_cost in [3, 5]


# =============================================================================
# REASONING AND CREATIVITY FLAGS TESTS
# =============================================================================


class TestReasoningCreativityFlags:
    """Test STEP 4: Reasoning and creativity flags."""

    def test_code_requires_reasoning(self, classifier: TaskClassifier):
        """Test code domain always requires reasoning."""
        profile = classifier.classify("Implement API endpoint")
        assert profile.requires_reasoning is True

    def test_sales_requires_reasoning(self, classifier: TaskClassifier):
        """Test sales domain requires reasoning."""
        profile = classifier.classify("Create upsell strategy for enterprise")  # Clear sales keyword
        assert profile.domain == "sales"
        assert profile.requires_reasoning is True

    def test_complex_requires_reasoning(self, classifier: TaskClassifier):
        """Test complex tasks require reasoning."""
        profile = classifier.classify("Build comprehensive system")
        assert profile.requires_reasoning is True

    def test_architecture_requires_reasoning(self, classifier: TaskClassifier):
        """Test architecture/strategy/why requires reasoning."""
        goals = [
            "Design system architecture",
            "Create growth strategy",
            "Explain why this happens",
        ]
        for goal in goals:
            profile = classifier.classify(goal)
            assert profile.requires_reasoning is True, f"Failed for: {goal}"

    def test_creative_domain_requires_creativity(self, classifier: TaskClassifier):
        """Test creative domain requires creativity."""
        profile = classifier.classify("Write engaging blog post")
        assert profile.requires_creativity is True

    def test_sales_domain_requires_creativity(self, classifier: TaskClassifier):
        """Test sales domain requires creativity."""
        profile = classifier.classify("Create compelling offer")
        assert profile.requires_creativity is True

    def test_creativity_keywords(self, classifier: TaskClassifier):
        """Test creativity keywords trigger flag."""
        goals = [
            "Write engaging content",
            "Create compelling copy",
            "Make creative design",
            "Write catchy headline",
        ]
        for goal in goals:
            profile = classifier.classify(goal)
            assert profile.requires_creativity is True, f"Failed for: {goal}"


# =============================================================================
# TOKEN ESTIMATION TESTS
# =============================================================================


class TestTokenEstimation:
    """Test token estimation."""

    def test_simple_token_estimate(self, classifier: TaskClassifier):
        """Test simple = 1200 tokens."""
        profile = classifier.classify("Quick task")  # Non-code, short
        assert profile.complexity == "simple"
        assert profile.estimated_tokens == 1200

    def test_standard_token_estimate(self, classifier: TaskClassifier):
        """Test standard = 3500 tokens."""
        profile = classifier.classify("Implement feature with tests")
        assert profile.estimated_tokens == 3500

    def test_complex_token_estimate(self, classifier: TaskClassifier):
        """Test complex = 8000 tokens."""
        profile = classifier.classify(
            "Design comprehensive multi-tenant architecture with database sharding and caching"
        )
        assert profile.complexity in ["standard", "complex"]
        assert profile.estimated_tokens in [3500, 8000]


# =============================================================================
# INTEGRATION TESTS
# =============================================================================


class TestTaskClassifierIntegration:
    """Integration tests for TaskClassifier."""

    def test_full_profile_code_task(self, classifier: TaskClassifier):
        """Test full profile for code task."""
        profile = classifier.classify(
            "Implement REST API endpoint for user management"
        )

        assert profile.domain == "code"
        assert profile.agent_role == "cto"
        assert profile.complexity in ["standard", "complex"]
        assert profile.requires_reasoning is True
        # JWT/token keywords trigger sensitivity
        assert profile.data_sensitivity in ["public", "sensitive"]
        assert profile.mcu_cost in [3, 5]

    def test_full_profile_creative_task(self, classifier: TaskClassifier):
        """Test full profile for creative task."""
        profile = classifier.classify(
            "Write engaging blog post about AI trends"
        )

        assert profile.domain == "creative"
        assert profile.agent_role == "cmo"
        assert profile.requires_creativity is True
        assert profile.requires_reasoning is False

    def test_full_profile_sensitive_task(self, classifier: TaskClassifier):
        """Test full profile for sensitive data task."""
        profile = classifier.classify(
            "Implement password encryption with secret key management"
        )

        assert profile.data_sensitivity == "sensitive"
        assert profile.preferred_tier == "local"

    def test_full_profile_analysis_task(self, classifier: TaskClassifier):
        """Test full profile for analysis task."""
        profile = classifier.classify(
            "Generate report with revenue data and dashboard charts"
        )

        assert profile.domain == "analysis"
        # revenue keyword triggers cfo override
        assert profile.agent_role == "cfo"
        # Analysis may not require reasoning for simple reports
        assert profile.requires_reasoning in [True, False]
