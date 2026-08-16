import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
import httpx
from apps.api.app.integrations.base import BaseIntegrationProvider

logger = logging.getLogger(__name__)


class GoogleSheetsProvider(BaseIntegrationProvider):
    def __init__(self, access_token: Optional[str] = None, spreadsheet_id: Optional[str] = None):
        self.access_token = access_token
        self.spreadsheet_id = spreadsheet_id
        self.base_url = "https://sheets.googleapis.com/v4/spreadsheets"

    async def append_lead_row(self, lead_data: Dict[str, Any], sheet_name: str = "Leads") -> Dict[str, Any]:
        """Appends a new qualified lead entry into the connected Google Sheet."""
        row_values = [
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            lead_data.get("name", "Unknown"),
            lead_data.get("phone", "N/A"),
            lead_data.get("email", "N/A"),
            lead_data.get("service", "General Inquiry"),
            lead_data.get("intent", "inquiry"),
            str(lead_data.get("score", 50)),
            lead_data.get("status", "new"),
            lead_data.get("appointment", "None"),
            lead_data.get("source", "Website Chat"),
            lead_data.get("notes", ""),
        ]

        if not self.access_token or not self.spreadsheet_id:
            logger.info(f"Google Sheets not connected. Simulating row append: {row_values}")
            return {"simulated": True, "updatedRange": f"{sheet_name}!A2:K2"}

        url = f"{self.base_url}/{self.spreadsheet_id}/values/{sheet_name}!A:K:append?valueInputOption=USER_ENTERED"
        headers = {"Authorization": f"Bearer {self.access_token}", "Content-Type": "application/json"}
        payload = {"values": [row_values]}

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            return resp.json()

    async def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        self.access_token = credentials.get("access_token")
        self.spreadsheet_id = credentials.get("spreadsheet_id")
        return await self.health_check()

    async def disconnect(self) -> bool:
        self.access_token = None
        self.spreadsheet_id = None
        return True

    async def health_check(self) -> Dict[str, Any]:
        if not self.access_token or not self.spreadsheet_id:
            return {"status": "not_configured", "configured": False}
        return {"status": "healthy", "configured": True}
