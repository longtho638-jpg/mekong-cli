import json
import os
from typing import Dict, List, Optional


class I18n:
    def __init__(self):
        self._current_locale = "en-US"
        self._locales = ['en-US', 'vi-VN', 'ar-SA', 'he-IL', 'zh-CN', 'ja-JP', 'es-ES', 'fr-FR', 'de-DE']
        self._translations: Dict[str, Dict[str, str]] = {
            "en-US": {
                "welcome": "Welcome",
                "hello": "Hello"
            },
            "vi-VN": {
                "welcome": "Chào mừng",
                "hello": "Xin chào"
            }
        }

    def get_available_locales(self) -> List[str]:
        return self._locales

    def get_locale(self) -> str:
        return self._current_locale

    def set_locale(self, locale: str):
        if locale in self._locales:
            self._current_locale = locale

    def translate(self, key: str, locale: Optional[str] = None) -> str:
        target_locale = locale or self._current_locale

        # Simple lookup
        if target_locale in self._translations and key in self._translations[target_locale]:
            return self._translations[target_locale][key]

        return key

i18n = I18n()

def t(key: str) -> str:
    return i18n.translate(key)
