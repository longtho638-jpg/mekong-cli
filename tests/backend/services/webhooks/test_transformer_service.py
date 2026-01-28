import pytest

from backend.services.webhooks.transformer_service import WebhookTransformer


class TestWebhookTransformer:

    def test_transform_payload_simple(self):
        transformer = WebhookTransformer()
        payload = {"user": "Alice", "id": 123}
        template = '{"message": "Hello {{ event.user }}", "ref_id": {{ event.id }}}'

        result = transformer.transform_payload(payload, template)

        assert result["message"] == "Hello Alice"
        assert result["ref_id"] == 123

    def test_transform_payload_no_template(self):
        transformer = WebhookTransformer()
        payload = {"a": 1}
        result = transformer.transform_payload(payload, None)
        assert result == payload

    def test_transform_invalid_json_output(self):
        transformer = WebhookTransformer()
        payload = {"a": 1}
        # Result isn't valid JSON
        template = 'Hello {{ event.a }}'

        with pytest.raises(ValueError) as excinfo:
            transformer.transform_payload(payload, template)
        assert "invalid JSON" in str(excinfo.value)

    def test_filter_fields(self):
        transformer = WebhookTransformer()
        payload = {
            "a": 1,
            "b": {
                "c": 2,
                "d": 3
            },
            "e": 4
        }

        exclude = ["a", "b.c"]
        result = transformer.filter_fields(payload, exclude)

        assert "a" not in result
        assert "b" in result
        assert "c" not in result["b"]
        assert "d" in result["b"]
        assert "e" in result
