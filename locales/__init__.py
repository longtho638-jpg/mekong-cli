"""
🌐 i18n - Internationalization for Agency OS
=============================================

Multi-language support for global franchise model.

Usage:
    from locales import i18n, t
    
    # Initialize with default locale
    i18n.set_locale("en")
    
    # Get translation
    print(t("common.welcome"))
    # → "Welcome to Agency OS"
    
    # Switch locale
    i18n.set_locale("vi")
    print(t("common.welcome"))
    # → "Chào mừng đến với Agency OS"
"""

import os
import json
from typing import Optional, Dict, Any
from pathlib import Path


class I18n:
    """
    Internationalization handler.
    
    Supports:
    - Multiple locales (en, vi, etc.)
    - Nested key access (e.g., "common.welcome")
    - Fallback to English
    - Region-specific overrides
    """

    def __init__(self, default_locale: str = "en"):
        self.locale = default_locale
        self.fallback_locale = "en"
        self.translations: Dict[str, Dict[str, Any]] = {}

        # Load available locales
        self.locales_dir = Path(__file__).parent
        self._load_all_locales()

    def _load_all_locales(self):
        """Load all available locale files."""
        for locale_dir in self.locales_dir.iterdir():
            if locale_dir.is_dir() and not locale_dir.name.startswith('_'):
                locale_code = locale_dir.name
                self._load_locale(locale_code)

    def _load_locale(self, locale_code: str):
        """Load a specific locale."""
        locale_path = self.locales_dir / locale_code / "common.json"

        if locale_path.exists():
            try:
                with open(locale_path, "r", encoding="utf-8") as f:
                    self.translations[locale_code] = json.load(f)
            except json.JSONDecodeError:
                print(f"⚠️ Failed to parse {locale_path}")

    def set_locale(self, locale: str):
        """Set the current locale."""
        if locale in self.translations:
            self.locale = locale
        else:
            print(f"⚠️ Locale '{locale}' not found, using '{self.fallback_locale}'")
            self.locale = self.fallback_locale

    def get_locale(self) -> str:
        """Get the current locale."""
        return self.locale

    def get_available_locales(self) -> list:
        """Get list of available locales."""
        return list(self.translations.keys())

    def translate(self, key: str, locale: Optional[str] = None, **kwargs) -> str:
        """
        Get translation for a key.
        
        Args:
            key: Dot-separated key (e.g., "common.welcome")
            locale: Override locale (optional)
            **kwargs: Variables to interpolate
            
        Returns:
            Translated string or key if not found
        """
        target_locale = locale or self.locale

        # Try target locale first
        result = self._get_nested(self.translations.get(target_locale, {}), key)

        # Fallback to English
        if result is None and target_locale != self.fallback_locale:
            result = self._get_nested(
                self.translations.get(self.fallback_locale, {}),
                key
            )

        # Return key if not found
        if result is None:
            return f"[{key}]"

        # Interpolate variables
        if kwargs:
            try:
                result = result.format(**kwargs)
            except KeyError:
                pass

        return result

    def _get_nested(self, data: dict, key: str) -> Optional[str]:
        """Get value from nested dict using dot notation."""
        keys = key.split(".")
        current = data

        for k in keys:
            if isinstance(current, dict) and k in current:
                current = current[k]
            else:
                return None

        return current if isinstance(current, str) else None


# Global instance
i18n = I18n()

# Shortcut function
def t(key: str, **kwargs) -> str:
    """Translate a key using the global i18n instance."""
    return i18n.translate(key, **kwargs)


# Example usage
if __name__ == "__main__":
    print("🌐 Agency OS i18n System")
    print(f"   Available locales: {i18n.get_available_locales()}")
    print()

    # English
    i18n.set_locale("en")
    print("🇺🇸 English:")
    print(f"   {t('app.name')}: {t('app.tagline')}")
    print(f"   {t('common.welcome')}")
    print(f"   {t('binh_phap.tagline')}")
    print()

    # Vietnamese
    i18n.set_locale("vi")
    print("🇻🇳 Tiếng Việt:")
    print(f"   {t('app.name')}: {t('app.tagline')}")
    print(f"   {t('common.welcome')}")
    print(f"   {t('binh_phap.tagline')}")
