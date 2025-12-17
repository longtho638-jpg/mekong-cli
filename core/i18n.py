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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class Language(Enum):
    """Supported languages."""
    EN = "en"      # English
    VI = "vi"      # Vietnamese
    ES = "es"      # Spanish
    FR = "fr"      # French
    DE = "de"      # German
    ZH = "zh"      # Chinese
    JA = "ja"      # Japanese
    KO = "ko"      # Korean
    PT = "pt"      # Portuguese
    AR = "ar"      # Arabic (RTL)


@dataclass
class LanguageConfig:
    """Language configuration."""
    code: str
    name: str
    native_name: str
    flag: str
    rtl: bool = False


class I18nManager:
    """
    Internationalization Manager.
    
    Multi-language support for Agency OS.
    """
    
    LANGUAGES = {
        Language.EN: LanguageConfig("en", "English", "English", "🇺🇸"),
        Language.VI: LanguageConfig("vi", "Vietnamese", "Tiếng Việt", "🇻🇳"),
        Language.ES: LanguageConfig("es", "Spanish", "Español", "🇪🇸"),
        Language.FR: LanguageConfig("fr", "French", "Français", "🇫🇷"),
        Language.DE: LanguageConfig("de", "German", "Deutsch", "🇩🇪"),
        Language.ZH: LanguageConfig("zh", "Chinese", "中文", "🇨🇳"),
        Language.JA: LanguageConfig("ja", "Japanese", "日本語", "🇯🇵"),
        Language.KO: LanguageConfig("ko", "Korean", "한국어", "🇰🇷"),
        Language.PT: LanguageConfig("pt", "Portuguese", "Português", "🇧🇷"),
        Language.AR: LanguageConfig("ar", "Arabic", "العربية", "🇸🇦", rtl=True),
    }
    
    # Core translations
    TRANSLATIONS = {
        "welcome": {
            "en": "Welcome to Agency OS",
            "vi": "Chào mừng đến với Agency OS",
            "es": "Bienvenido a Agency OS",
            "fr": "Bienvenue sur Agency OS",
            "de": "Willkommen bei Agency OS",
            "zh": "欢迎使用 Agency OS",
            "ja": "Agency OS へようこそ",
            "ko": "Agency OS에 오신 것을 환영합니다",
        },
        "dashboard": {
            "en": "Dashboard",
            "vi": "Bảng điều khiển",
            "es": "Panel de control",
            "fr": "Tableau de bord",
            "de": "Dashboard",
            "zh": "仪表板",
            "ja": "ダッシュボード",
            "ko": "대시보드",
        },
        "clients": {
            "en": "Clients",
            "vi": "Khách hàng",
            "es": "Clientes",
            "fr": "Clients",
            "de": "Kunden",
            "zh": "客户",
            "ja": "クライアント",
            "ko": "고객",
        },
        "projects": {
            "en": "Projects",
            "vi": "Dự án",
            "es": "Proyectos",
            "fr": "Projets",
            "de": "Projekte",
            "zh": "项目",
            "ja": "プロジェクト",
            "ko": "프로젝트",
        },
        "invoices": {
            "en": "Invoices",
            "vi": "Hóa đơn",
            "es": "Facturas",
            "fr": "Factures",
            "de": "Rechnungen",
            "zh": "发票",
            "ja": "請求書",
            "ko": "청구서",
        },
        "reports": {
            "en": "Reports",
            "vi": "Báo cáo",
            "es": "Informes",
            "fr": "Rapports",
            "de": "Berichte",
            "zh": "报告",
            "ja": "レポート",
            "ko": "보고서",
        },
        "settings": {
            "en": "Settings",
            "vi": "Cài đặt",
            "es": "Configuración",
            "fr": "Paramètres",
            "de": "Einstellungen",
            "zh": "设置",
            "ja": "設定",
            "ko": "설정",
        },
        "thank_you": {
            "en": "Thank you for choosing us!",
            "vi": "Cảm ơn bạn đã chọn chúng tôi!",
            "es": "¡Gracias por elegirnos!",
            "fr": "Merci de nous avoir choisis!",
            "de": "Danke, dass Sie uns gewählt haben!",
            "zh": "感谢您选择我们!",
            "ja": "お選びいただきありがとうございます!",
            "ko": "저희를 선택해 주셔서 감사합니다!",
        },
    }
    
    def __init__(self, default_language: Language = Language.EN):
        self.current_language = default_language
        self.custom_translations: Dict[str, Dict[str, str]] = {}
    
    def set_language(self, language: Language):
        """Set current language."""
        self.current_language = language
    
    def t(self, key: str) -> str:
        """Translate a key to current language."""
        lang_code = self.current_language.value
        
        # Check custom translations first
        if key in self.custom_translations:
            if lang_code in self.custom_translations[key]:
                return self.custom_translations[key][lang_code]
        
        # Fall back to built-in translations
        if key in self.TRANSLATIONS:
            return self.TRANSLATIONS[key].get(lang_code, self.TRANSLATIONS[key].get("en", key))
        
        return key
    
    def add_translation(self, key: str, translations: Dict[str, str]):
        """Add custom translation."""
        self.custom_translations[key] = translations
    
    def get_available_languages(self) -> List[LanguageConfig]:
        """Get list of available languages."""
        return list(self.LANGUAGES.values())
    
    def format_language_selector(self) -> str:
        """Format language selector."""
        current = self.LANGUAGES[self.current_language]
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🌍 MULTI-LANGUAGE SUPPORT                                ║",
            f"║  Current: {current.flag} {current.native_name:<42}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🌐 AVAILABLE LANGUAGES                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for lang, config in self.LANGUAGES.items():
            selected = "●" if lang == self.current_language else "○"
            rtl_badge = " (RTL)" if config.rtl else ""
            lines.append(f"║  {selected} {config.flag} {config.native_name:<15} ({config.name}){rtl_badge:<10}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📝 SAMPLE TRANSLATIONS                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for key in ["welcome", "dashboard", "clients", "invoices"]:
            translation = self.t(key)
            lines.append(f"║    {key:<12}: {translation[:38]:<38}  ║")
        
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🏯 Agency OS - Global by design!                         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    i18n = I18nManager(Language.EN)
    
    print("🌍 Multi-Language (i18n) Support")
    print("=" * 60)
    print()
    
    print("English:")
    print(i18n.format_language_selector())
    print()
    
    # Switch to Vietnamese
    i18n.set_language(Language.VI)
    print("Vietnamese:")
    print(i18n.format_language_selector())
