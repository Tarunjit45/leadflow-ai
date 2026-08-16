from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class BaseIntegrationProvider(ABC):
    @abstractmethod
    async def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Connects or authenticates the third party service."""
        pass

    @abstractmethod
    async def disconnect(self) -> bool:
        """Disconnects the integration and revokes tokens if applicable."""
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Checks connectivity and token validity."""
        pass
