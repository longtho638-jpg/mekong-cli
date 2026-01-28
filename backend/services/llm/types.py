from typing import TypedDict, Optional

class TokenUsage(TypedDict):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class LLMResponse(TypedDict):
    content: str
    usage: Optional[TokenUsage]
