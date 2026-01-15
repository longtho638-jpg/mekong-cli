---
description: How to set up and use Gemini API with AgencyOS for vision and video analysis
---

# Gemini API Integration

Enhance AgencyOS with superior vision and video analysis capabilities.

## TLDR
Claude focuses on coding; Gemini excels at vision and video analysis.
Use Gemini API for:
- Screenshot analysis
- Blueprint/diagram reading
- Video debugging
- Document analysis (PDF, docx, xlsx)

## Installation

### Step 1: Get API Key
// turbo
```bash
# Get your key at:
# https://aistudio.google.com/api-keys
```

### Step 2: Configure Environment
```bash
# Copy example env
cp .agencyos/.env.example .agencyos/.env

# OR for global install:
cp ~/.agencyos/.env.example ~/.agencyos/.env
```

### Step 3: Add API Key
```bash
# Edit .agencyos/.env
GEMINI_API_KEY=your_api_key_here
```

That's it!

## Why Gemini for Vision?

### Claude's Limitation
Claude's vision model is optimized for code, not image analysis.

Example comparisons:
- Blueprint reading: Gemini provides detailed descriptions
- Screenshot analysis: Gemini identifies UI elements accurately
- Video debugging: Only Gemini can analyze videos

### Video Analysis
Gemini (web version) can analyze screen recordings for debugging:
- Record bug reproduction
- Upload to Gemini
- Get root cause suggestions

## Using AI-Multimodal Skill

Skills auto-activate based on context. For manual activation:

// turbo
```bash
use ai-multimodal to analyze this screenshot: [paste image]
```

### Common Use Cases
```bash
# Analyze screenshot
use ai-multimodal to analyze this screenshot

# Read blueprint
use ai-multimodal to describe this architecture diagram

# Debug UI issue
use ai-multimodal what's wrong with this form layout?

# Extract from PDF
use ai-multimodal to extract data from this invoice
```

## Human MCP (Legacy)
AgencyOS previously used Human MCP for Gemini integration.
Now replaced by Agent Skills for better context efficiency.

## Cost Note
Gemini API incurs costs. Skip this if you don't need vision/video analysis.

## 🤖 Gemini CLI Bridge (NEW)

Claude/Antigravity có thể điều khiển Gemini CLI thay anh với rate limiting tự động:

### Quick Commands
// turbo
```bash
# Kiểm tra status
node .claude/scripts/gemini-bridge.cjs status

# Hỏi Gemini
node .claude/scripts/gemini-bridge.cjs ask "your question"

# Phân tích hình
node .claude/scripts/gemini-bridge.cjs vision ./image.png

# Code review
node .claude/scripts/gemini-bridge.cjs code ./file.js
```

### Features
- ✅ Rate limiting: 15 requests/minute
- ✅ Auto retry: Exponential backoff (2^n seconds)
- ✅ Error handling: Tự động xử lý lỗi 429

## 🏯 Binh Pháp Alignment
"用間篇" (Dụng Gián) - Intelligence - Leverage external tools for specialized capabilities.
