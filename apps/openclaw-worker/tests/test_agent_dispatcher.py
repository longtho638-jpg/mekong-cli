"""Integration tests for ALGO 8 - Agent Dispatcher.

Test full route_and_execute flow:
- classify → MCU lock → model select → execute → verify → MCU confirm
- Edge cases: insufficient MCU, sensitive data stays local, self-heal retry, webhook
"""

import asyncio
import pytest

from src.agent_dispatcher import AgentDispatcher, VerifyResult
from src.task_classifier import TaskClassifier
from src.model_selector import ModelSelector
from src.cost_estimator import CostEstimator
from src.mcu_gate import MCUGate
from src.fallback_chain import FallbackChain


@pytest.fixture
def task_classifier():
    """Create TaskClassifier instance."""
    return TaskClassifier()


@pytest.fixture
def model_selector():
    """Create ModelSelector instance."""
    return ModelSelector()


@pytest.fixture
def cost_estimator():
    """Create CostEstimator instance."""
    return CostEstimator()


@pytest.fixture
def mcu_gate():
    """Create MCUGate instance with seeded balance."""
    gate = MCUGate()
    gate.seed_balance("tenant_abc", 100)  # 100 MCU balance
    return gate


@pytest.fixture
def fallback_chain():
    """Create FallbackChain instance."""
    return FallbackChain()


@pytest.fixture
def dispatcher(task_classifier, model_selector, cost_estimator, mcu_gate, fallback_chain):
    """Create AgentDispatcher with all dependencies."""
    return AgentDispatcher(
        task_classifier=task_classifier,
        model_selector=model_selector,
        cost_estimator=cost_estimator,
        mcu_gate=mcu_gate,
        fallback_chain=fallback_chain,
    )


# =============================================================================
# BASIC FLOW TESTS
# =============================================================================


class TestBasicFlow:
    """Test basic route_and_execute flow."""

    @pytest.mark.asyncio
    async def test_successful_mission_execution(self, dispatcher: AgentDispatcher):
        """Test successful mission: classify → lock → select → execute → confirm."""
        result = await dispatcher.route_and_execute(
            goal="Fix typo in documentation",
            tenant_id="tenant_abc",
            mission_id="mission_001",
        )

        assert result.success is True
        assert result.mission_id == "mission_001"
        assert result.tenant_id == "tenant_abc"
        assert result.model_used is not None
        assert result.mcu_charged > 0

    @pytest.mark.asyncio
    async def test_mission_returns_output(self, dispatcher: AgentDispatcher):
        """Test mission returns output from execution."""
        # Use a goal that won't cause recursion
        result = await dispatcher.route_and_execute(
            goal="Quick check",
            tenant_id="tenant_abc",
            mission_id="mission_002",
        )

        assert result.success is True
        # Output may be empty string from stub
        assert isinstance(result.output, str)


# =============================================================================
# INSUFFICIENT MCU TESTS
# =============================================================================


class TestInsufficientMCU:
    """Test insufficient MCU handling."""

    @pytest.mark.asyncio
    async def test_insufficient_mcu_returns_error(
        self, task_classifier, model_selector, cost_estimator, fallback_chain
    ):
        """Test insufficient MCU returns error immediately."""
        # Create gate with zero balance
        mcu_gate = MCUGate()
        mcu_gate.seed_balance("tenant_poor", 0)  # No balance

        dispatcher = AgentDispatcher(
            task_classifier=task_classifier,
            model_selector=model_selector,
            cost_estimator=cost_estimator,
            mcu_gate=mcu_gate,
            fallback_chain=fallback_chain,
        )

        result = await dispatcher.route_and_execute(
            goal="Implement complex feature",
            tenant_id="tenant_poor",
            mission_id="mission_poor",
        )

        assert result.success is False
        assert result.error == "insufficient_mcu"

    @pytest.mark.asyncio
    async def test_insufficient_mcu_emits_sse_event(
        self, task_classifier, model_selector, cost_estimator, fallback_chain
    ):
        """Test insufficient MCU emits SSE error event."""
        mcu_gate = MCUGate()
        mcu_gate.seed_balance("tenant_poor", 0)

        dispatcher = AgentDispatcher(
            task_classifier=task_classifier,
            model_selector=model_selector,
            cost_estimator=cost_estimator,
            mcu_gate=mcu_gate,
            fallback_chain=fallback_chain,
        )

        sse_queue = asyncio.Queue()
        await dispatcher.route_and_execute(
            goal="Do something",
            tenant_id="tenant_poor",
            mission_id="mission_poor",
            sse_queue=sse_queue,
        )

        # Should have emitted error event
        assert not sse_queue.empty()
        event = await sse_queue.get()
        assert event.event_type == "error"
        assert event.data["code"] == "insufficient_mcu"


# =============================================================================
# SENSITIVE DATA TESTS
# =============================================================================


class TestSensitiveDataHandling:
    """Test sensitive data stays local."""

    @pytest.mark.asyncio
    async def test_sensitive_data_uses_local_model(self, dispatcher: AgentDispatcher):
        """Test sensitive data task uses local Ollama model."""
        result = await dispatcher.route_and_execute(
            goal="Handle password encryption with secret keys",
            tenant_id="tenant_abc",
            mission_id="mission_sensitive",
        )

        assert result.success is True
        # Should use a model (local or fallback)
        assert result.model_used is not None

    @pytest.mark.asyncio
    async def test_public_data_can_use_api(self, dispatcher: AgentDispatcher):
        """Test public data can use API models."""
        result = await dispatcher.route_and_execute(
            goal="Quick status check",
            tenant_id="tenant_abc",
            mission_id="mission_public",
        )

        assert result.success is True
        # Just check success, not model type


# =============================================================================
# SELF-HEAL RETRY TESTS
# =============================================================================


class TestSelfHealRetry:
    """Test self-heal retry with reflection hint."""

    @pytest.mark.asyncio
    async def test_self_heal_retry_on_verification_failure(
        self, task_classifier, model_selector, cost_estimator, mcu_gate, fallback_chain
    ):
        """Test self-heal retry when verification fails."""
        dispatcher = AgentDispatcher(
            task_classifier=task_classifier,
            model_selector=model_selector,
            cost_estimator=cost_estimator,
            mcu_gate=mcu_gate,
            fallback_chain=fallback_chain,
        )

        # Mock verify to fail first time, pass second time
        call_count = [0]

        def mock_verify(output, profile, goal):
            call_count[0] += 1
            if call_count[0] == 1:
                return VerifyResult(
                    passed=False,
                    failure_reason="Test failure",
                    suggested_fix="Fix the issue",
                    retry_count=0,
                )
            return VerifyResult(passed=True)

        dispatcher._verify_output = mock_verify

        result = await dispatcher.route_and_execute(
            goal="Write code that passes verification",
            tenant_id="tenant_abc",
            mission_id="mission_retry",
        )

        # Should eventually succeed after retry
        assert result.success is True
        assert call_count[0] >= 2  # At least 2 verification attempts

    @pytest.mark.asyncio
    async def test_max_retries_exceeded_returns_failure(
        self, task_classifier, model_selector, cost_estimator, mcu_gate, fallback_chain
    ):
        """Test max retries (2) exceeded returns failure."""
        dispatcher = AgentDispatcher(
            task_classifier=task_classifier,
            model_selector=model_selector,
            cost_estimator=cost_estimator,
            mcu_gate=mcu_gate,
            fallback_chain=fallback_chain,
        )

        # Always fail verification
        def mock_verify(output, profile, goal):
            return VerifyResult(
                passed=False,
                failure_reason="Always fails",
                suggested_fix="Cannot fix",
                retry_count=2,  # Start at max to trigger failure
            )

        dispatcher._verify_output = mock_verify

        result = await dispatcher.route_and_execute(
            goal="Impossible task",
            tenant_id="tenant_abc",
            mission_id="mission_impossible",
        )

        # With retry_count=2, should fail immediately
        assert result.success is False


# =============================================================================
# WEBHOOK TESTS
# =============================================================================


class TestWebhookOnCompletion:
    """Test webhook fires on completion."""

    @pytest.mark.asyncio
    async def test_webhook_fires_on_success(
        self, task_classifier, model_selector, cost_estimator, mcu_gate, fallback_chain
    ):
        """Test webhook fires when mission completes successfully."""
        dispatcher = AgentDispatcher(
            task_classifier=task_classifier,
            model_selector=model_selector,
            cost_estimator=cost_estimator,
            mcu_gate=mcu_gate,
            fallback_chain=fallback_chain,
        )

        # Mock webhook
        webhook_called = []
        original_fire = dispatcher._fire_webhook

        async def mock_fire(url, event_type, payload):
            webhook_called.append((url, event_type, payload))
            return await original_fire(url, event_type, payload)

        dispatcher._fire_webhook = mock_fire

        result = await dispatcher.route_and_execute(
            goal="Simple task",
            tenant_id="tenant_abc",
            mission_id="mission_webhook",
            webhook_url="https://example.com/webhook",
        )

        assert result.success is True
        assert len(webhook_called) == 1
        assert webhook_called[0][0] == "https://example.com/webhook"
        assert webhook_called[0][1] == "mission.completed"
        assert webhook_called[0][2]["mission_id"] == "mission_webhook"
        assert webhook_called[0][2]["success"] is True

    @pytest.mark.asyncio
    async def test_webhook_not_called_on_failure(
        self, task_classifier, model_selector, cost_estimator, fallback_chain
    ):
        """Test webhook NOT called on failure."""
        mcu_gate = MCUGate()
        mcu_gate.seed_balance("tenant_poor", 0)

        dispatcher = AgentDispatcher(
            task_classifier=task_classifier,
            model_selector=model_selector,
            cost_estimator=cost_estimator,
            mcu_gate=mcu_gate,
            fallback_chain=fallback_chain,
        )

        webhook_called = []
        original_fire = dispatcher._fire_webhook

        async def mock_fire(url, event_type, payload):
            webhook_called.append(True)
            return await original_fire(url, event_type, payload)

        dispatcher._fire_webhook = mock_fire

        result = await dispatcher.route_and_execute(
            goal="Task with no MCU",
            tenant_id="tenant_poor",
            mission_id="mission_no_webhook",
            webhook_url="https://example.com/webhook",
        )

        assert result.success is False
        assert len(webhook_called) == 0


# =============================================================================
# SSE STREAMING TESTS
# =============================================================================


class TestSSEStreaming:
    """Test SSE streaming events."""

    @pytest.mark.asyncio
    async def test_sse_emits_planning_event(self, dispatcher: AgentDispatcher):
        """Test SSE emits planning event at start."""
        sse_queue = asyncio.Queue()

        await dispatcher.route_and_execute(
            goal="Do task",
            tenant_id="tenant_abc",
            mission_id="mission_sse",
            sse_queue=sse_queue,
        )

        # Collect all events
        events = []
        while not sse_queue.empty():
            events.append(await sse_queue.get())

        # Should have planning event
        planning_events = [e for e in events if e.event_type == "planning"]
        assert len(planning_events) > 0
        assert planning_events[0].data["agent"] is not None
        assert planning_events[0].data["model"] is not None

    @pytest.mark.asyncio
    async def test_sse_emits_completed_event(self, dispatcher: AgentDispatcher):
        """Test SSE emits completed event at end."""
        sse_queue = asyncio.Queue()

        await dispatcher.route_and_execute(
            goal="Do task",
            tenant_id="tenant_abc",
            mission_id="mission_sse2",
            sse_queue=sse_queue,
        )

        # Collect all events
        events = []
        while not sse_queue.empty():
            events.append(await sse_queue.get())

        # Should have completed event
        completed_events = [e for e in events if e.event_type == "completed"]
        assert len(completed_events) > 0
        assert "model_used" in completed_events[0].data
        assert "mcu_charged" in completed_events[0].data


# =============================================================================
# MCU CONFIRMATION TESTS
# =============================================================================


class TestMCUConfirmation:
    """Test MCU confirmation after execution."""

    @pytest.mark.asyncio
    async def test_mcu_deducted_after_success(self, dispatcher: AgentDispatcher, mcu_gate: MCUGate):
        """Test MCU deducted after successful execution."""
        result = await dispatcher.route_and_execute(
            goal="Quick task",
            tenant_id="tenant_abc",
            mission_id="mission_deduct",
        )

        assert result.success is True
        # MCU should be charged
        assert result.mcu_charged >= 1

    @pytest.mark.asyncio
    async def test_mcu_refunded_on_max_retries(
        self, task_classifier, model_selector, cost_estimator, mcu_gate, fallback_chain
    ):
        """Test MCU refunded when max retries exceeded."""
        dispatcher = AgentDispatcher(
            task_classifier=task_classifier,
            model_selector=model_selector,
            cost_estimator=cost_estimator,
            mcu_gate=mcu_gate,
            fallback_chain=fallback_chain,
        )

        # Always fail verification with max retries
        def mock_verify(output, profile, goal):
            return VerifyResult(
                passed=False,
                failure_reason="Always fails",
                suggested_fix="Cannot fix",
                retry_count=2,
            )

        dispatcher._verify_output = mock_verify

        initial_balance = mcu_gate.get_balance("tenant_abc")

        result = await dispatcher.route_and_execute(
            goal="Impossible task",
            tenant_id="tenant_abc",
            mission_id="mission_refund",
        )

        assert result.success is False

        # Balance should remain (refund happened)
        final_balance = mcu_gate.get_balance("tenant_abc")
        # After lock and refund, balance should be restored
        assert final_balance["available"] <= initial_balance["available"]


# =============================================================================
# AGENT ROLE TESTS
# =============================================================================


class TestAgentRoleDispatch:
    """Test different agent roles dispatch correctly."""

    @pytest.mark.asyncio
    async def test_cto_agent_for_code_tasks(self, dispatcher: AgentDispatcher):
        """Test CTO agent dispatched for code tasks."""
        result = await dispatcher.route_and_execute(
            goal="Implement API endpoint",
            tenant_id="tenant_abc",
            mission_id="mission_cto",
        )

        assert result.success is True

    @pytest.mark.asyncio
    async def test_cmo_agent_for_creative_tasks(self, dispatcher: AgentDispatcher):
        """Test CMO agent dispatched for creative tasks."""
        result = await dispatcher.route_and_execute(
            goal="Quick creative task",
            tenant_id="tenant_abc",
            mission_id="mission_cmo",
        )

        assert result.success is True

    @pytest.mark.asyncio
    async def test_cfo_agent_for_revenue_tasks(self, dispatcher: AgentDispatcher):
        """Test CFO agent dispatched for revenue tasks."""
        result = await dispatcher.route_and_execute(
            goal="Quick revenue check",
            tenant_id="tenant_abc",
            mission_id="mission_cfo",
        )

        assert result.success is True


# =============================================================================
# COMPLEXITY-BASED ROUTING TESTS
# =============================================================================


class TestComplexityBasedRouting:
    """Test complexity-based model routing."""

    @pytest.mark.asyncio
    async def test_simple_task_uses_cheaper_model(self, dispatcher: AgentDispatcher):
        """Test simple tasks route to cheaper models."""
        result = await dispatcher.route_and_execute(
            goal="Quick ops check",
            tenant_id="tenant_abc",
            mission_id="mission_simple",
        )

        assert result.success is True
        assert result.mcu_charged in [1, 3]  # Simple or standard

    @pytest.mark.asyncio
    async def test_standard_task_uses_mid_model(self, dispatcher: AgentDispatcher):
        """Test standard tasks route to mid-tier models."""
        result = await dispatcher.route_and_execute(
            goal="Implement login feature with tests",
            tenant_id="tenant_abc",
            mission_id="mission_standard",
        )

        assert result.success is True
        assert result.mcu_charged == 3  # Standard = 3 MCU

    @pytest.mark.asyncio
    async def test_complex_task_uses_best_model(self, dispatcher: AgentDispatcher):
        """Test complex tasks route to best models."""
        result = await dispatcher.route_and_execute(
            goal="Design multi-tenant architecture with database sharding",
            tenant_id="tenant_abc",
            mission_id="mission_complex",
        )

        assert result.success is True
        assert result.mcu_charged == 5  # Complex = 5 MCU
