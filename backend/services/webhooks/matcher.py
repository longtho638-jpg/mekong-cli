"""
Subscription Matcher Service.
Handles conditional delivery logic (filtering) for webhooks.
"""

import json
import logging
import re
from typing import Any, Dict, List, Union

# Try importing jsonpath_ng, handle if missing
try:
    from jsonpath_ng import parse as jsonpath_parse

    JSONPATH_AVAILABLE = True
except ImportError:
    JSONPATH_AVAILABLE = False

logger = logging.getLogger(__name__)


class SubscriptionMatcher:
    """
    Evaluates if an event matches a webhook subscription's criteria.
    """

    def is_match(
        self, subscription: Dict[str, Any], event_type: str, payload: Dict[str, Any]
    ) -> bool:
        """
        Check if event matches subscription.
        Checks:
        1. Event Type pattern (glob)
        2. Filter Criteria (JSONPath or simple dict match)
        """
        # 1. Event Type Match
        allowed_events = subscription.get("event_types", [])
        if not self._match_event_type(allowed_events, event_type):
            return False

        # 2. Conditional Filters
        filters = subscription.get("filters")
        if filters:
            if not self._match_filters(filters, payload):
                return False

        return True

    def _match_event_type(self, allowed_patterns: List[str], event_type: str) -> bool:
        """
        Check if event_type matches any of the allowed patterns.
        Supports '*' and wildcards like 'user.*'.
        """
        if "*" in allowed_patterns:
            return True

        for pattern in allowed_patterns:
            if pattern == event_type:
                return True
            # Regex match for wildcards
            # user.* -> ^user\..*$
            regex = pattern.replace(".", "\.").replace("*", ".*")
            if re.match(f"^{regex}$", event_type):
                return True
        return False

    def _match_filters(self, filters: Union[Dict[str, Any], str], payload: Dict[str, Any]) -> bool:
        """
        Evaluate conditional filters.
        Supports:
        - Dictionary match: {"user.plan": "enterprise"}
        - JSONPath (if string starts with $)
        """
        try:
            # List of filters (OR logic or AND logic? Usually AND)
            if isinstance(filters, dict):
                return self._match_dict_filter(filters, payload)

            if isinstance(filters, list):
                # Assume OR for list of filters? Or AND?
                # Let's assume AND for now to be restrictive, or OR if they are separate rules.
                # Common pattern: List of conditions that MUST all match.
                return all(self._match_filters(f, payload) for f in filters)

            if isinstance(filters, str) and filters.startswith("$"):
                return self._match_jsonpath(filters, payload)

            return True  # Default allow if format unknown
        except Exception as e:
            logger.error(f"Filter matching error: {e}")
            return False

    def _match_dict_filter(self, criteria: Dict[str, Any], payload: Dict[str, Any]) -> bool:
        """
        Recursively check if payload contains criteria.
        Flattened keys supported: "user.id": 123
        """
        for key, expected_value in criteria.items():
            # Handle dot notation
            keys = key.split(".")
            value = payload
            try:
                for k in keys:
                    value = value[k]

                if value != expected_value:
                    return False
            except (KeyError, TypeError):
                return False
        return True

    def _match_jsonpath(self, expression: str, payload: Dict[str, Any]) -> bool:
        """
        Evaluate JSONPath expression.
        If expression returns any match, it's considered True.
        Example: $.user[?(@.plan=='enterprise')]
        """
        if not JSONPATH_AVAILABLE:
            logger.warning("jsonpath-ng not installed, skipping JSONPath filter")
            return True  # Fail open or closed? Open for now to not break existing.

        try:
            expr = jsonpath_parse(expression)
            match = expr.find(payload)
            return bool(match)
        except Exception as e:
            logger.error(f"JSONPath error: {e}")
            return False
