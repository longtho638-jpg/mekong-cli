"""
🌍 Multi-Language (i18n) - Global Agency Support
==================================================

Support multiple languages for global agencies.
Reach clients worldwide!

Features:
- Multiple language support
- Easy translation management
- Locale detection
- RTL support ready
"""

import logging
from typing import Dict
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Language(Enum):
    """Supported business languages."""
    EN = "en"
    VI = "vi"
    ES = "es"
    FR = "fr"
    ZH = "zh"
    JA = "ja"
    AR = "ar"


@dataclass
class LanguageConfig:
    """Configuration metadata for a language."""
    code: str
    name: str
    native_name: str
    flag: str
    rtl: bool = False


class I18nManager:
    """
    Internationalization Manager System.
    
    Orchestrates localized content and system translations across the Agency OS.
    """
    
    LANG_REGISTRY = {
        Language.EN: LanguageConfig("en", "English", "English", "🇺🇸"),
        Language.VI: LanguageConfig("vi", "Vietnamese", "Tiếng Việt", "🇻🇳"),
        Language.JA: LanguageConfig("ja", "Japanese", "日本語", "🇯🇵"),
        Language.AR: LanguageConfig("ar", "Arabic", "العربية", "🇸🇦", rtl=True),
    }
    
    TRANSLATIONS = {
        "welcome": {"en": "Welcome", "vi": "Chào mừng", "ja": "ようこそ"},
        "dashboard": {"en": "Dashboard", "vi": "Bảng điều khiển", "ja": "ダッシュボード"},
        "settings": {"en": "Settings", "vi": "Cài đặt", "ja": "設定"},
    }
    
    def __init__(self, default_lang: Language = Language.EN):
        self.current_lang = default_lang
        self.custom_map: Dict[str, Dict[str, str]] = {}
        logger.info(f"I18n Manager initialized. Default: {default_lang.value}")
    
    def set_lang(self, lang: Language):
        """Switch the current active system language."""
        if lang in self.LANG_REGISTRY:
            self.current_lang = lang
            logger.info(f"System language set to: {lang.value}")
        else:
            logger.error(f"Unsupported language: {lang}")
    
    def t(self, key: str, **kwargs) -> str:
        """Translate a string key into the current active language."""
        code = self.current_lang.value
        
        # 1. Check custom overrides
        val = self.custom_map.get(key, {}).get(code)
        
        # 2. Check system translations
        if not val:
            val = self.TRANSLATIONS.get(key, {}).get(code)
            
        # 3. Fallback to English
        if not val:
            val = self.TRANSLATIONS.get(key, {}).get("en", key)
            
        # 4. Perform variable interpolation
        if kwargs:
            try:
                val = val.format(**kwargs)
            except KeyError as e:
                logger.warning(f"Translation interpolation error for {key}: missing {e}")
                
        return val
    
    def format_status(self) -> str:
        """Render the I18n Status Dashboard."""
        current = self.LANG_REGISTRY[self.current_lang]
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🌍 I18N SYSTEM STATUS - {self.current_lang.value.upper()}{' ' * 32}║",
            f"║  Active: {current.flag} {current.native_name:<15} │ RTL: {'Yes' if current.rtl else 'No ':<10} {' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🌐 SUPPORTED LOCALES                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for lang, cfg in self.LANG_REGISTRY.items():
            sel = "●" if lang == self.current_lang else "○"
            lines.append(f"║  {sel} {cfg.flag} {cfg.native_name:<15} ({cfg.code}) {' ' * 30} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [🌐 Change Language]  [📝 Edit Translations]  [⚙️ Setup] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 Global Agency OS - \"World is Local\"{' ' * 19}║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🌍 Initializing I18n...")
    print("=" * 60)
    
    try:
        manager = I18nManager(Language.VI)
        print("\n" + manager.format_status())
        print(f"\nExample translation (Dashboard): {manager.t('dashboard')}")
        
    except Exception as e:
        logger.error(f"I18n Error: {e}")
