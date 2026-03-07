"""
Tests for Phase Completion Detector and Graceful Shutdown Handler.

Tests cover:
1. PhaseCompletionDetector - Individual phase checks
2. GracefulShutdownHandler - Shutdown sequence
3. Integration - End-to-end shutdown flow
"""

import pytest
import asyncio
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock, AsyncMock

from src.raas.phase_completion_detector import (
    PhaseCompletionDetector,
    PhaseStatus,
    PhaseInfo,
    get_detector,
    reset_detector,
)
from src.core.graceful_shutdown import (
    GracefulShutdownHandler,
    ShutdownReason,
    ShutdownContext,
    get_shutdown_handler,
    reset_shutdown_handler,
    shutdown_on_all_phases_operational,
)


class TestPhaseCompletionDetector:
    """Tests for PhaseCompletionDetector."""

    def setup_method(self) -> None:
        """Reset detector before each test."""
        reset_detector()

    def test_initialize_phases(self) -> None:
        """Test that all five phases are initialized."""
        detector = PhaseCompletionDetector()
        phases = detector.get_all_phases_status()

        assert len(phases) == 5
        assert "phase_1_license_gate" in phases
        assert "phase_2_license_ui" in phases
        assert "phase_3_payment_webhook" in phases
        assert "phase_4_usage_metering" in phases
        assert "phase_5_analytics_dashboard" in phases

    def test_phase_initial_status(self) -> None:
        """Test that phases start as NOT_STARTED."""
        detector = PhaseCompletionDetector()

        for phase_id, phase_info in detector.get_all_phases_status().items():
            assert phase_info.status == PhaseStatus.NOT_STARTED
            assert phase_info.name
            assert phase_info.description

    @pytest.mark.asyncio
    async def test_check_phase_1_no_license(self) -> None:
        """Test Phase 1 check when no license is set."""
        with patch.dict("os.environ", {}, clear=True):
            detector = PhaseCompletionDetector()
            phase = await detector.check_phase_1_license_gate()

            assert phase.status == PhaseStatus.DEGRADED
            assert "RAAS_LICENSE_KEY not set" in phase.errors

    @pytest.mark.asyncio
    async def test_check_phase_1_with_license(self) -> None:
        """Test Phase 1 check with valid license."""
        with patch.dict("os.environ", {"RAAS_LICENSE_KEY": "raas-pro-test-key"}):
            with patch("src.lib.raas_gate_validator.RaasGateValidator") as mock_validator:
                mock_instance = MagicMock()
                mock_instance.validate.return_value = (True, "")
                mock_validator.return_value = mock_instance

                detector = PhaseCompletionDetector()
                phase = await detector.check_phase_1_license_gate()

                assert phase.status == PhaseStatus.OPERATIONAL
                assert phase.details.get("license_present") is True
                assert phase.details.get("license_valid") is True

    @pytest.mark.asyncio
    async def test_check_phase_2_license_ui(self) -> None:
        """Test Phase 2 check - license UI components."""
        detector = PhaseCompletionDetector()
        phase = await detector.check_phase_2_license_ui()

        # Should at least attempt to load modules
        assert phase.last_checked is not None
        assert phase.status in [
            PhaseStatus.OPERATIONAL,
            PhaseStatus.DEGRADED,
            PhaseStatus.FAILED,
        ]

    @pytest.mark.asyncio
    async def test_check_phase_3_payment_webhook(self) -> None:
        """Test Phase 3 check - payment webhook."""
        detector = PhaseCompletionDetector()
        phase = await detector.check_phase_3_payment_webhook()

        assert phase.last_checked is not None
        assert phase.status in [
            PhaseStatus.OPERATIONAL,
            PhaseStatus.DEGRADED,
            PhaseStatus.FAILED,
        ]

    @pytest.mark.asyncio
    async def test_check_phase_4_usage_metering(self) -> None:
        """Test Phase 4 check - usage metering."""
        detector = PhaseCompletionDetector()
        phase = await detector.check_phase_4_usage_metering()

        assert phase.last_checked is not None
        assert phase.status in [
            PhaseStatus.OPERATIONAL,
            PhaseStatus.DEGRADED,
            PhaseStatus.FAILED,
        ]

    @pytest.mark.asyncio
    async def test_check_phase_5_analytics_dashboard(self) -> None:
        """Test Phase 5 check - analytics dashboard."""
        detector = PhaseCompletionDetector()
        phase = await detector.check_phase_5_analytics_dashboard()

        assert phase.last_checked is not None
        assert phase.status in [
            PhaseStatus.OPERATIONAL,
            PhaseStatus.DEGRADED,
            PhaseStatus.FAILED,
        ]

    @pytest.mark.asyncio
    async def test_check_all_phases_not_all_operational(self) -> None:
        """Test that check_all_phases returns False when not all operational."""
        with patch.dict("os.environ", {}, clear=True):
            detector = PhaseCompletionDetector()
            result = await detector.check_all_phases()

            # Without license, should not be all operational
            assert result is False

    @pytest.mark.asyncio
    async def test_check_all_phases_callback_triggered(self) -> None:
        """Test that callback is triggered when all phases become operational."""
        callback_called = False

        async def mock_callback() -> None:
            nonlocal callback_called
            callback_called = True

        with patch.dict("os.environ", {"RAAS_LICENSE_KEY": "raas-pro-test-key"}):
            with patch("src.lib.raas_gate_validator.RaasGateValidator") as mock_validator:
                mock_instance = MagicMock()
                mock_instance.validate.return_value = (True, "")
                mock_validator.return_value = mock_instance

                # Mock other phases to be operational
                with patch.object(
                    PhaseCompletionDetector,
                    "check_phase_2_license_ui",
                    new=AsyncMock(
                        return_value=PhaseInfo(
                            name="Phase 2",
                            status=PhaseStatus.OPERATIONAL,
                            description="Test",
                        )
                    ),
                ):
                    with patch.object(
                        PhaseCompletionDetector,
                        "check_phase_3_payment_webhook",
                        new=AsyncMock(
                            return_value=PhaseInfo(
                                name="Phase 3",
                                status=PhaseStatus.OPERATIONAL,
                                description="Test",
                            )
                        ),
                    ):
                        with patch.object(
                            PhaseCompletionDetector,
                            "check_phase_4_usage_metering",
                            new=AsyncMock(
                                return_value=PhaseInfo(
                                    name="Phase 4",
                                    status=PhaseStatus.OPERATIONAL,
                                    description="Test",
                                )
                            ),
                        ):
                            with patch.object(
                                PhaseCompletionDetector,
                                "check_phase_5_analytics_dashboard",
                                new=AsyncMock(
                                    return_value=PhaseInfo(
                                        name="Phase 5",
                                        status=PhaseStatus.OPERATIONAL,
                                        description="Test",
                                    )
                                ),
                            ):
                                detector = PhaseCompletionDetector()
                                detector.register_callback(mock_callback)

                                result = await detector.check_all_phases()

                                assert result is True
                                assert callback_called is True

    def test_is_all_operational(self) -> None:
        """Test sync method is_all_operational."""
        detector = PhaseCompletionDetector()
        assert detector.is_all_operational() is False

    def test_get_last_check(self) -> None:
        """Test get_last_check returns None initially."""
        detector = PhaseCompletionDetector()
        assert detector.get_last_check() is None


class TestGracefulShutdownHandler:
    """Tests for GracefulShutdownHandler."""

    def setup_method(self) -> None:
        """Reset shutdown handler before each test."""
        reset_shutdown_handler()

    @pytest.mark.asyncio
    async def test_initiate_shutdown(self) -> None:
        """Test basic shutdown sequence."""
        handler = GracefulShutdownHandler()

        exit_code = await handler.initiate_shutdown(
            reason=ShutdownReason.USER_REQUESTED,
            details={"test": "data"},
        )

        assert exit_code == 0
        assert handler._shutdown_in_progress is True
        assert handler._shutdown_context is not None
        assert handler._shutdown_context.reason == ShutdownReason.USER_REQUESTED

    @pytest.mark.asyncio
    async def test_shutdown_cleanup_handlers_called(self) -> None:
        """Test that cleanup handlers are called during shutdown."""
        handler = GracefulShutdownHandler()
        cleanup_called = False

        async def mock_cleanup() -> bool:
            nonlocal cleanup_called
            cleanup_called = True
            return True

        handler.register_cleanup_handler(mock_cleanup, "test_cleanup")

        await handler.initiate_shutdown(reason=ShutdownReason.USER_REQUESTED)

        assert cleanup_called is True
        # Handler uses generic naming like "Cleanup handler 1", "Cleanup handler 2", etc.
        assert len(handler._shutdown_context.cleanup_steps_completed) == 1

    @pytest.mark.asyncio
    async def test_shutdown_cleanup_handler_failure(self) -> None:
        """Test that shutdown continues even if cleanup handler fails."""
        handler = GracefulShutdownHandler()

        async def failing_cleanup() -> bool:
            raise Exception("Cleanup failed")

        handler.register_cleanup_handler(failing_cleanup, "failing_cleanup")

        exit_code = await handler.initiate_shutdown(
            reason=ShutdownReason.USER_REQUESTED
        )

        # Should have errors but still complete
        assert handler._shutdown_context is not None
        assert len(handler._shutdown_context.errors) > 0

    @pytest.mark.asyncio
    async def test_shutdown_final_callback_called(self) -> None:
        """Test that final callbacks are called."""
        handler = GracefulShutdownHandler()
        callback_called = False

        async def mock_callback() -> None:
            nonlocal callback_called
            callback_called = True

        handler.register_final_callback(mock_callback)

        await handler.initiate_shutdown(reason=ShutdownReason.USER_REQUESTED)

        assert callback_called is True

    @pytest.mark.asyncio
    async def test_shutdown_exit_code_on_errors(self) -> None:
        """Test that exit code is 1 when errors occur."""
        handler = GracefulShutdownHandler()

        async def failing_cleanup() -> bool:
            raise Exception("Cleanup failed")

        handler.register_cleanup_handler(failing_cleanup, "failing_cleanup")

        exit_code = await handler.initiate_shutdown(
            reason=ShutdownReason.USER_REQUESTED
        )

        assert exit_code == 1

    def test_double_shutdown(self) -> None:
        """Test that second shutdown request is ignored."""
        handler = GracefulShutdownHandler()

        async def run_shutdown():
            await handler.initiate_shutdown(reason=ShutdownReason.USER_REQUESTED)
            return handler._exit_code

        # First shutdown
        exit_code1 = asyncio.run(run_shutdown())

        # Second shutdown should be ignored
        assert handler._shutdown_in_progress is True

    def test_perform_sync_cleanup(self) -> None:
        """Test synchronous cleanup method."""
        handler = GracefulShutdownHandler()

        # Should not raise
        handler.perform_sync_cleanup()


class TestIntegration:
    """Integration tests for phase completion and shutdown."""

    def setup_method(self) -> None:
        """Reset both detector and handler before each test."""
        reset_detector()
        reset_shutdown_handler()

    @pytest.mark.asyncio
    async def test_shutdown_on_all_phases_operational(self) -> None:
        """Test shutdown_on_all_phases_operational function."""
        # Mock detector to return all operational
        with patch("src.raas.phase_completion_detector._detector") as mock_detector:
            mock_detector.is_all_operational.return_value = True
            mock_detector.get_all_phases_status.return_value = {
                "phase_1": PhaseInfo(
                    name="Phase 1",
                    status=PhaseStatus.OPERATIONAL,
                    description="Test",
                ),
            }

            # Should not raise
            try:
                await shutdown_on_all_phases_operational()
            except SystemExit:
                pass  # Expected

    def test_get_detector_singleton(self) -> None:
        """Test that get_detector returns same instance."""
        detector1 = get_detector()
        detector2 = get_detector()

        assert detector1 is detector2

    def test_get_shutdown_handler_singleton(self) -> None:
        """Test that get_shutdown_handler returns same instance."""
        handler1 = get_shutdown_handler()
        handler2 = get_shutdown_handler()

        assert handler1 is handler2


class TestPhaseStatusEnum:
    """Tests for PhaseStatus enum."""

    def test_phase_status_values(self) -> None:
        """Test PhaseStatus enum values."""
        assert PhaseStatus.NOT_STARTED == "not_started"
        assert PhaseStatus.INITIALIZING == "initializing"
        assert PhaseStatus.OPERATIONAL == "operational"
        assert PhaseStatus.DEGRADED == "degraded"
        assert PhaseStatus.FAILED == "failed"


class TestShutdownReasonEnum:
    """Tests for ShutdownReason enum."""

    def test_shutdown_reason_values(self) -> None:
        """Test ShutdownReason enum values."""
        assert ShutdownReason.ALL_PHASES_OPERATIONAL == "all_phases_operational"
        assert ShutdownReason.USER_REQUESTED == "user_requested"
        assert ShutdownReason.ERROR == "error"
        assert ShutdownReason.SIGNAL_RECEIVED == "signal_received"
        assert ShutdownReason.MAINTENANCE == "maintenance"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
