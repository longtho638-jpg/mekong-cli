from unittest.mock import MagicMock, patch

import pytest

from backend.services.webhooks.matcher import SubscriptionMatcher


class TestSubscriptionMatcher:

    @pytest.fixture
    def matcher(self):
        return SubscriptionMatcher()

    def test_match_event_type_exact(self, matcher):
        sub = {"event_types": ["user.created"]}
        assert matcher.is_match(sub, "user.created", {}) is True
        assert matcher.is_match(sub, "user.updated", {}) is False

    def test_match_event_type_wildcard_all(self, matcher):
        sub = {"event_types": ["*"]}
        assert matcher.is_match(sub, "any.event", {}) is True

    def test_match_event_type_wildcard_prefix(self, matcher):
        sub = {"event_types": ["user.*"]}
        assert matcher.is_match(sub, "user.created", {}) is True
        assert matcher.is_match(sub, "user.updated", {}) is True
        assert matcher.is_match(sub, "order.created", {}) is False

    def test_match_event_type_multiple(self, matcher):
        sub = {"event_types": ["user.created", "order.*"]}
        assert matcher.is_match(sub, "user.created", {}) is True
        assert matcher.is_match(sub, "order.paid", {}) is True
        assert matcher.is_match(sub, "other", {}) is False

    def test_match_filters_simple_dict(self, matcher):
        sub = {
            "event_types": ["*"],
            "filters": {"status": "active"}
        }
        assert matcher.is_match(sub, "evt", {"status": "active"}) is True
        assert matcher.is_match(sub, "evt", {"status": "inactive"}) is False

    def test_match_filters_nested_dict(self, matcher):
        sub = {
            "event_types": ["*"],
            "filters": {"user.profile.verified": True}
        }
        payload_match = {"user": {"profile": {"verified": True}}}
        payload_mismatch = {"user": {"profile": {"verified": False}}}
        payload_missing = {"user": {}}

        assert matcher.is_match(sub, "evt", payload_match) is True
        assert matcher.is_match(sub, "evt", payload_mismatch) is False
        assert matcher.is_match(sub, "evt", payload_missing) is False

    def test_match_filters_list(self, matcher):
        # Assume list means ALL conditions must match (AND)
        sub = {
            "event_types": ["*"],
            "filters": [{"status": "active"}, {"type": "A"}]
        }
        assert matcher.is_match(sub, "evt", {"status": "active", "type": "A"}) is True
        assert matcher.is_match(sub, "evt", {"status": "active", "type": "B"}) is False

    @patch("backend.services.webhooks.matcher.JSONPATH_AVAILABLE", False)
    def test_jsonpath_unavailable(self, matcher):
        # Should default to True/Allow if library missing
        sub = {
            "event_types": ["*"],
            "filters": "$.store.book[*].author"
        }
        assert matcher.is_match(sub, "evt", {}) is True
