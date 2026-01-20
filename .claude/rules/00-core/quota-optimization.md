# Quota Optimization Rule

> **"Tiết kiệm là quốc sách" - Tối ưu hóa tài nguyên Gemini**

## 1. Principles
- **Maximize Free Tier**: Tận dụng tối đa Gemini Flash/Pro free tier.
- **Failover Strategy**: Flash (Speed) -> Pro (Depth) -> Ultra (Complex).
- **Caching**: Cache các kết quả heavy computation hoặc static knowledge.

## 2. Model Selection Strategy
| Task Type | Recommended Model | Reason |
|-----------|-------------------|--------|
| **Planning** | `gemini-3-pro` | Deep reasoning needed |
| **Coding** | `gemini-3-flash` | Speed & Context window |
| **Chat/Quick** | `gemini-3-flash` | Low latency |
| **Vision** | `gemini-3-flash` | Multimodal efficiency |

## 3. Proxy Configuration
- Use `antigravity-claude-proxy` running on port 8080.
- Monitor usage via `quota_server` MCP.
- Rotate keys if rate limits are hit (automatically handled by engine).

## 4. Token Economy
- **Context Loading**: Use `Task` tool over `Read` for large files when possible (let agents handle it).
- **Summarization**: Summarize massive logs before processing.
- **Modularization**: Keep files small (<200 lines) to save context.

## 5. Daily Quota Check
Run `commander` or `quota` MCP to check status:
```bash
# Check quota status
/quota/get_status
```
