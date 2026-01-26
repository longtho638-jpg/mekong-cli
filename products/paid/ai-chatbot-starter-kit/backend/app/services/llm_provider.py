from typing import AsyncIterator, List, Dict, Any
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from app.config import get_settings
from app.models.chat import LLMProvider, Message, Role

settings = get_settings()

class LLMService:
    def __init__(self, provider: LLMProvider, model: str, temperature: float = 0.7):
        self.provider = provider
        self.model = model
        self.temperature = temperature
        self.llm = self._initialize_llm()

    def _initialize_llm(self):
        if self.provider == LLMProvider.OPENAI:
            return ChatOpenAI(
                model=self.model,
                temperature=self.temperature,
                streaming=True,
                api_key=settings.OPENAI_API_KEY
            )
        elif self.provider == LLMProvider.ANTHROPIC:
            return ChatAnthropic(
                model=self.model,
                temperature=self.temperature,
                streaming=True,
                api_key=settings.ANTHROPIC_API_KEY
            )
        elif self.provider == LLMProvider.GOOGLE:
            return ChatGoogleGenerativeAI(
                model=self.model,
                temperature=self.temperature,
                streaming=True,
                google_api_key=settings.GOOGLE_API_KEY
            )
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    def _convert_messages(self, messages: List[Message]) -> List[BaseMessage]:
        langchain_messages = []
        for msg in messages:
            if msg.role == Role.USER:
                langchain_messages.append(HumanMessage(content=msg.content))
            elif msg.role == Role.ASSISTANT:
                langchain_messages.append(AIMessage(content=msg.content))
            elif msg.role == Role.SYSTEM:
                langchain_messages.append(SystemMessage(content=msg.content))
        return langchain_messages

    async def stream_response(self, messages: List[Message]) -> AsyncIterator[str]:
        langchain_msgs = self._convert_messages(messages)
        async for chunk in self.llm.astream(langchain_msgs):
            yield chunk.content

    async def generate_response(self, messages: List[Message]) -> str:
        langchain_msgs = self._convert_messages(messages)
        response = await self.llm.ainvoke(langchain_msgs)
        return response.content
