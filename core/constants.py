"""
🌊 Mekong Agency OS - Global Constants
======================================

Central repository for all agency-wide constants, niches, and configurations.
"Biết người biết ta, trăm trận không nguy."
"""

from enum import Enum
from typing import Dict, List, Tuple

# --- App Metadata ---
APP_NAME = "🌊 MEKONG-CLI"
APP_VERSION = "2.5.0"


# --- Industry Niches ---
class Niche(Enum):
    RICE_TRADING = "rice-trading"
    FISH_SEAFOOD = "fish-seafood"
    FURNITURE = "furniture"
    CONSTRUCTION = "construction-materials"
    AGRICULTURE = "agriculture-tools"
    REAL_ESTATE = "real-estate"
    RESTAURANTS = "restaurants"
    BEAUTY_SPA = "beauty-spa"
    AUTOMOTIVE = "automotive"
    EDUCATION = "education"


NICHES: Dict[str, str] = {
    "1": Niche.RICE_TRADING.value,
    "2": Niche.FISH_SEAFOOD.value,
    "3": Niche.FURNITURE.value,
    "4": Niche.CONSTRUCTION.value,
    "5": Niche.AGRICULTURE.value,
    "6": Niche.REAL_ESTATE.value,
    "7": Niche.RESTAURANTS.value,
    "8": Niche.BEAUTY_SPA.value,
    "9": Niche.AUTOMOTIVE.value,
    "10": Niche.EDUCATION.value,
}

NICHE_DESCRIPTIONS: List[str] = [
    "🌾 rice-trading (Lúa Gạo)",
    "🐟 fish-seafood (Cá Tra)",
    "🛋️ furniture (Nội Thất)",
    "🏗️ construction-materials (Vật Liệu XD)",
    "🚜 agriculture-tools (Máy Nông Nghiệp)",
    "🏠 real-estate (Bất Động Sản)",
    "🍜 restaurants (Nhà Hàng)",
    "💅 beauty-spa (Thẩm Mỹ Viện)",
    "🚗 automotive (Ô Tô)",
    "📚 education (Trung Tâm Học)",
]

# --- Cultural Vibes ---
VIBES: List[Tuple[str, str, str, str]] = [
    ("mien-tay", "Miền Tây", "Thân thiện, chân thành, ấm áp", "hen, nghen, tui, bà con"),
    ("mien-bac", "Miền Bắc", "Lịch sự, trang trọng, chỉn chu", "ạ, nhé, vâng, xin phép"),
    ("mien-trung", "Miền Trung", "Mộc mạc, thật thà, kiên cường", "mô, tê, răng, rứa"),
    ("gen-z", "Gen Z", "Trendy, năng động, hài hước", "slay, vibe, chill, xịn xò"),
    ("professional", "Professional", "Chuyên nghiệp, thuyết phục", "chiến lược, tối ưu, giải pháp"),
]

# --- AI Agents Config ---
AGENTS_CORE = [
    {"name": "Scout", "role": "Thu thập thông tin", "status": "Ready", "icon": "🔍"},
    {"name": "Editor", "role": "Biên tập nội dung", "status": "Ready", "icon": "✏️"},
    {"name": "Director", "role": "Đạo diễn video", "status": "Ready", "icon": "🎬"},
    {"name": "Community", "role": "Đăng bài & tương tác", "status": "Ready", "icon": "🤝"},
]

AGENTS_MEKONG = [
    {
        "name": "Market Analyst",
        "role": "Phân tích giá nông sản ĐBSCL",
        "status": "Ready",
        "icon": "📊",
    },
    {
        "name": "Zalo Integrator",
        "role": "Tích hợp Zalo OA/Mini App",
        "status": "Ready",
        "icon": "💬",
    },
    {
        "name": "Local Copywriter",
        "role": "Viết content giọng địa phương",
        "status": "Ready",
        "icon": "🎤",
    },
]

# --- Provider Costs (Token Pricing) ---
PROVIDERS_COSTS = [
    ("Llama 3.1 8B", "$0.0001", "Simple text generation"),
    ("Llama 3.1 70B", "$0.0006", "Advanced reasoning"),
    ("Gemini 2.0 Flash", "$0.0007", "Multimodal, long context"),
    ("Gemini 2.0 Pro", "$0.006", "Complex analysis"),
    ("Claude 3.5 Sonnet", "$0.018", "Code, structural analysis"),
]

# --- System Packages ---
MCP_PACKAGES = [
    "@anthropic/mcp-server-filesystem",
    "@anthropic/mcp-server-fetch",
    "@anthropic/mcp-server-playwright",
]
