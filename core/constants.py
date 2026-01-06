from typing import Dict, List, Tuple

APP_NAME = "🌊 MEKONG-CLI"

NICHES: Dict[str, str] = {
    "1": "rice-trading",
    "2": "fish-seafood",
    "3": "furniture",
    "4": "construction-materials",
    "5": "agriculture-tools",
    "6": "real-estate",
    "7": "restaurants",
    "8": "beauty-spa",
    "9": "automotive",
    "10": "education"
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
    "📚 education (Trung Tâm Học)"
]

VIBES: List[Tuple[str, str, str, str]] = [
    ("mien-tay", "Miền Tây", "Thân thiện, chân thành, ấm áp", "hen, nghen, tui, bà con"),
    ("mien-bac", "Miền Bắc", "Lịch sự, trang trọng, chỉn chu", "ạ, nhé, vâng, xin phép"),
    ("mien-trung", "Miền Trung", "Mộc mạc, thật thà, kiên cường", "mô, tê, răng, rứa"),
    ("gen-z", "Gen Z", "Trendy, năng động, hài hước", "slay, vibe, chill, xịn xò"),
    ("professional", "Professional", "Chuyên nghiệp, thuyết phục", "chiến lược, tối ưu, giải pháp"),
]

AGENTS_CORE = [
    {"name": "Scout", "role": "Thu thập thông tin", "status": "Ready", "icon": "🔍"},
    {"name": "Editor", "role": "Biên tập nội dung", "status": "Ready", "icon": "✏️"},
    {"name": "Director", "role": "Đạo diễn video", "status": "Ready", "icon": "🎬"},
    {"name": "Community", "role": "Đăng bài & tương tác", "status": "Ready", "icon": "🤝"},
]

AGENTS_MEKONG = [
    {"name": "Market Analyst", "role": "Phân tích giá nông sản ĐBSCL", "status": "Ready", "icon": "📊"},
    {"name": "Zalo Integrator", "role": "Tích hợp Zalo OA/Mini App", "status": "Ready", "icon": "💬"},
    {"name": "Local Copywriter", "role": "Viết content giọng địa phương", "status": "Ready", "icon": "🎤"},
]

PROVIDERS_COSTS = [
    ("Llama 3.1 8B", "$0.0001", "Simple text"),
    ("Llama 3.1 70B", "$0.0006", "Medium tasks"),
    ("Gemini 2.5 Flash", "$0.0007", "Vision, long context"),
    ("Gemini 2.5 Pro", "$0.006", "Complex reasoning"),
    ("Claude Sonnet", "$0.018", "Code, analysis"),
]

MCP_PACKAGES = [
    "@anthropic/mcp-server-filesystem",
    "@anthropic/mcp-server-fetch",
    "@anthropic/mcp-server-playwright"
]