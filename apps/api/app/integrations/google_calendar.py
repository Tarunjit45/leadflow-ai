import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import httpx
from apps.api.app.integrations.base import BaseIntegrationProvider
from apps.api.app.core.config import settings

logger = logging.getLogger(__name__)


class GoogleCalendarProvider(BaseIntegrationProvider):
    def __init__(self, access_token: Optional[str] = None, refresh_token: Optional[str] = None):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.base_url = "https://www.googleapis.com/calendar/v3"

    def get_oauth_url(self, state: str) -> str:
        """Generates Google OAuth consent screen authorization URL."""
        client_id = settings.GOOGLE_CLIENT_ID or "mock-google-client-id"
        redirect_uri = settings.GOOGLE_REDIRECT_URI
        scopes = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events"
        return (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope={scopes}&"
            f"access_type=offline&"
            f"prompt=consent&"
            f"state={state}"
        )

    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchanges authorization code for Google access and refresh tokens."""
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            # Simulated token response for local testing
            return {
                "access_token": f"ya29.simulated_access_token_{int(datetime.now().timestamp())}",
                "refresh_token": "1//simulated_refresh_token_xyz",
                "expires_in": 3600,
                "scope": "https://www.googleapis.com/auth/calendar",
                "token_type": "Bearer",
            }

        url = "https://oauth2.googleapis.com/token"
        payload = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, data=payload)
            resp.raise_for_status()
            return resp.json()

    async def get_free_busy(
        self,
        time_min: datetime,
        time_max: datetime,
        time_zone: str = "America/New_York",
    ) -> List[Dict[str, Any]]:
        """Queries Google Calendar FreeBusy API to determine busy slots."""
        if not self.access_token:
            # Return realistic simulated busy slots for local dev
            return []

        url = f"{self.base_url}/freeBusy"
        headers = {"Authorization": f"Bearer {self.access_token}", "Content-Type": "application/json"}
        payload = {
            "timeMin": time_min.isoformat(),
            "timeMax": time_max.isoformat(),
            "timeZone": time_zone,
            "items": [{"id": "primary"}],
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data.get("calendars", {}).get("primary", {}).get("busy", [])
            except Exception as e:
                logger.error(f"Error fetching Google Calendar FreeBusy: {str(e)}")
                return []

    async def create_event(
        self,
        summary: str,
        description: str,
        start_time: datetime,
        end_time: datetime,
        attendee_email: Optional[str] = None,
        time_zone: str = "America/New_York",
    ) -> Dict[str, Any]:
        """Creates a Google Calendar Event."""
        if not self.access_token:
            return {
                "id": f"gcal_evt_sim_{int(datetime.now().timestamp())}",
                "htmlLink": "https://calendar.google.com/calendar/event?eid=mock",
                "summary": summary,
                "start": {"dateTime": start_time.isoformat(), "timeZone": time_zone},
                "end": {"dateTime": end_time.isoformat(), "timeZone": time_zone},
            }

        url = f"{self.base_url}/calendars/primary/events"
        headers = {"Authorization": f"Bearer {self.access_token}", "Content-Type": "application/json"}
        payload: Dict[str, Any] = {
            "summary": summary,
            "description": description,
            "start": {"dateTime": start_time.isoformat(), "timeZone": time_zone},
            "end": {"dateTime": end_time.isoformat(), "timeZone": time_zone},
        }
        if attendee_email:
            payload["attendees"] = [{"email": attendee_email}]

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            return resp.json()

    async def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        self.access_token = credentials.get("access_token")
        self.refresh_token = credentials.get("refresh_token")
        return await self.health_check()

    async def disconnect(self) -> bool:
        self.access_token = None
        self.refresh_token = None
        return True

    async def health_check(self) -> Dict[str, Any]:
        if not self.access_token:
            return {"status": "not_configured", "configured": False}
        return {"status": "healthy", "configured": True}
