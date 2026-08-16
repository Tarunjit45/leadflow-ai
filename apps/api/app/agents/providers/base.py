from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class AIMessage(BaseModel):
    role: str  # system, user, assistant, tool
    content: str
    name: Optional[str] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None
    tool_call_id: Optional[str] = None


class AICompletionResult(BaseModel):
    content: str
    tool_calls: List[Dict[str, Any]] = []
    model: str
    tokens_used: int = 0
    latency_ms: int = 0
    raw_response: Optional[Dict[str, Any]] = None


class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        messages: List[AIMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
        model: Optional[str] = None,
        max_tokens: int = 1024,
    ) -> AICompletionResult:
        """Generates a chat completion given a list of messages and tool specifications."""
        pass
