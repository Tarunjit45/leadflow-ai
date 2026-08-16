import hmac
import hashlib
import json
import logging
from typing import Any, Dict, Optional
import httpx
from apps.api.app.integrations.base import BaseIntegrationProvider
from apps.api.app.core.config import settings

logger = logging.getLogger(__name__)


class WhatsAppProvider(BaseIntegrationProvider):
    def __init__(
        self,
        access_token: Optional[str] = None,
        phone_number_id: Optional[str] = None,
        app_secret: Optional[str] = None,
        verify_token: Optional[str] = None,
    ):
        self.access_token = access_token or settings.META_ACCESS_TOKEN
        self.phone_number_id = phone_number_id or settings.META_PHONE_NUMBER_ID
        self.app_secret = app_secret or settings.META_APP_SECRET
        self.verify_token = verify_token or settings.META_VERIFY_TOKEN
        self.api_version = "v20.0"
        self.base_url = f"https://graph.facebook.com/{self.api_version}"

    def verify_webhook_challenge(self, mode: str, token: str, challenge: str) -> Optional[str]:
        """Validates Meta's webhook challenge handshake."""
        if mode == "subscribe" and token == self.verify_token:
            return challenge
        return None

    def verify_payload_signature(self, raw_body: bytes, signature_header: Optional[str]) -> bool:
        """Validates the HMAC-SHA256 signature from Meta webhook requests."""
        if not self.app_secret:
            # If app secret is not configured in development, pass verification
            return True
        if not signature_header or not signature_header.startswith("sha256="):
            return False

        expected_hash = signature_header.split("sha256=")[1]
        mac = hmac.new(self.app_secret.encode("utf-8"), msg=raw_body, digestmod=hashlib.sha256)
        computed_hash = mac.hexdigest()
        return hmac.compare_digest(computed_hash, expected_hash)

    async def send_text_message(self, recipient_phone: str, text: str) -> Dict[str, Any]:
        """Sends an outbound WhatsApp text message using the Cloud API."""
        if not self.access_token or not self.phone_number_id:
            logger.warning("WhatsApp credentials missing. Simulating successful outbound delivery.")
            return {"simulated": True, "messages": [{"id": f"wamid.simulated_{int(httpx._types.float_time())}"}]}

        url = f"{self.base_url}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": recipient_phone.replace("+", "").replace("-", "").replace(" ", ""),
            "type": "text",
            "text": {"preview_url": False, "body": text},
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Failed to send WhatsApp message to {recipient_phone}: {str(e)}")
                return {"error": str(e), "success": False}

    async def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        self.access_token = credentials.get("access_token")
        self.phone_number_id = credentials.get("phone_number_id")
        return await self.health_check()

    async def disconnect(self) -> bool:
        self.access_token = None
        return True

    async def health_check(self) -> Dict[str, Any]:
        if not self.access_token or not self.phone_number_id:
            return {"status": "not_configured", "configured": False}
        
        url = f"{self.base_url}/{self.phone_number_id}"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    return {"status": "healthy", "configured": True, "details": resp.json()}
                return {"status": "error", "configured": True, "details": resp.text}
            except Exception as e:
                return {"status": "error", "configured": True, "error": str(e)}
