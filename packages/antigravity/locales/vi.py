"""
Vietnamese localization for AntigravityKit.

Supports:
- Miền Tây (Southern)
- Miền Bắc (Northern)
- Miền Trung (Central)
"""

VI_COMMON = {
    "welcome": "Chào mừng đến với AntigravityKit!",
    "success": "Thành công!",
    "error": "Lỗi!",
    "client": "Khách hàng",
    "service": "Dịch vụ",
    "revenue": "Doanh thu",
    "content": "Nội dung",
    "agency": "Đại lý",
}

VI_MIEN_TAY = {
    **VI_COMMON,
    "greeting": "Dạ chào anh chị!",
    "thanks": "Cảm ơn anh chị nhiều nha!",
    "success": "Xong rồi nha!",
    "encourage": "Ráng lên nha anh chị!",
}

VI_MIEN_BAC = {
    **VI_COMMON,
    "greeting": "Xin chào quý khách!",
    "thanks": "Xin cảm ơn ạ!",
    "success": "Đã hoàn thành!",
    "encourage": "Cố lên nhé!",
}

VI_MIEN_TRUNG = {
    **VI_COMMON,
    "greeting": "Chào mừng quý khách!",
    "thanks": "Cảm ơn rất nhiều!",
    "success": "Đã xong!",
    "encourage": "Cố gắng lên nha!",
}


def get_locale(tone: str = "mien_tay"):
    """Get locale dictionary based on tone."""
    locales = {
        "mien_tay": VI_MIEN_TAY,
        "mien_bac": VI_MIEN_BAC,
        "mien_trung": VI_MIEN_TRUNG,
    }
    return locales.get(tone, VI_COMMON)
