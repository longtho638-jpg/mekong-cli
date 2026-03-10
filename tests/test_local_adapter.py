"""Tests for ALGO 5 — Local Adapter (Ollama)."""

from __future__ import annotations

import json
from unittest.mock import patch, MagicMock


from src.core.local_adapter import OllamaAdapter, QUANTIZATION_MAP


class TestQuantizationMap:
    def test_all_models_have_quant(self):
        expected = [
            "llama3.3:70b", "deepseek-coder-v2:33b", "deepseek-coder-v2:16b",
            "llama3.2:3b", "qwen2.5:7b", "mistral:7b",
        ]
        for model in expected:
            assert model in QUANTIZATION_MAP

    def test_small_model_higher_quant(self):
        assert QUANTIZATION_MAP["llama3.2:3b"] == "q8_0"  # full quant for tiny

    def test_large_model_lower_quant(self):
        assert QUANTIZATION_MAP["llama3.3:70b"] == "q4_K_M"  # save VRAM


class TestOllamaAdapterInit:
    def test_default_base_url(self):
        adapter = OllamaAdapter()
        assert "11434" in adapter.base_url

    def test_custom_base_url(self):
        adapter = OllamaAdapter(base_url="http://custom:8080")
        assert adapter.base_url == "http://custom:8080"

    def test_empty_pulled_models(self):
        adapter = OllamaAdapter()
        assert len(adapter.pulled_models) == 0


class TestHealthCheck:
    @patch("urllib.request.urlopen")
    def test_healthy(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.__enter__ = lambda s: s
        mock_resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_resp

        adapter = OllamaAdapter()
        assert adapter.health_check() is True

    @patch("urllib.request.urlopen", side_effect=ConnectionError("refused"))
    def test_unhealthy(self, mock_urlopen):
        adapter = OllamaAdapter()
        assert adapter.health_check() is False

    @patch("urllib.request.urlopen", side_effect=TimeoutError("timeout"))
    def test_timeout(self, mock_urlopen):
        adapter = OllamaAdapter()
        assert adapter.health_check() is False


class TestListModels:
    @patch("urllib.request.urlopen")
    def test_lists_models(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({
            "models": [
                {"name": "llama3.2:3b"},
                {"name": "mistral:7b"},
            ]
        }).encode()
        mock_resp.__enter__ = lambda s: s
        mock_resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_resp

        adapter = OllamaAdapter()
        models = adapter.list_models()
        assert "llama3.2:3b" in models
        assert "mistral:7b" in models

    @patch("urllib.request.urlopen", side_effect=ConnectionError)
    def test_returns_empty_on_error(self, mock_urlopen):
        adapter = OllamaAdapter()
        assert adapter.list_models() == []


class TestGetVramLoad:
    @patch("urllib.request.urlopen")
    def test_no_models_running(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({"models": []}).encode()
        mock_resp.__enter__ = lambda s: s
        mock_resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_resp

        adapter = OllamaAdapter()
        assert adapter.get_vram_load() == 0.0

    @patch("urllib.request.urlopen", side_effect=ConnectionError)
    def test_returns_zero_on_error(self, mock_urlopen):
        adapter = OllamaAdapter()
        assert adapter.get_vram_load() == 0.0

    @patch.dict("os.environ", {"GPU_TOTAL_VRAM_GB": "16"})
    @patch("urllib.request.urlopen")
    def test_calculates_load(self, mock_urlopen):
        # 8GB of 16GB = 0.5 load
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({
            "models": [{"size": 8 * 1_073_741_824}]
        }).encode()
        mock_resp.__enter__ = lambda s: s
        mock_resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_resp

        adapter = OllamaAdapter()
        load = adapter.get_vram_load()
        assert 0.49 < load < 0.51


class TestSyncGenerate:
    @patch("urllib.request.urlopen")
    def test_strips_ollama_prefix(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({
            "message": {"content": "Hello world"}
        }).encode()
        mock_resp.__enter__ = lambda s: s
        mock_resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_resp

        adapter = OllamaAdapter()
        result = adapter.generate_sync("ollama:llama3.2:3b", [{"role": "user", "content": "hi"}])
        assert result == "Hello world"

    @patch("urllib.request.urlopen", side_effect=ConnectionError)
    def test_returns_empty_on_error(self, mock_urlopen):
        adapter = OllamaAdapter()
        result = adapter.generate_sync("llama3.2:3b", [{"role": "user", "content": "hi"}])
        assert result == ""
