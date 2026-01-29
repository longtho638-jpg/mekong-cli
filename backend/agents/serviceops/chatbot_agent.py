"""
Chatbot Agent - AI-Powered Customer Support (Proxy)
==============================================
This file is now a proxy for the modularized version in ./chatbot_logic/
Please import from backend.agents.serviceops.chatbot_logic instead.
"""

import warnings

from .chatbot_logic import Channel, ChatbotAgent, Conversation, Intent, Message

# Issue a deprecation warning
warnings.warn(
    "backend.agents.serviceops.chatbot_agent is deprecated. "
    "Use backend.agents.serviceops.chatbot_logic instead.",
    DeprecationWarning,
    stacklevel=2,
)
