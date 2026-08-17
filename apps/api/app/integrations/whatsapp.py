import hmac
import hashlib
import json
import logging
from typing import Any, Dict, Optional
import httpx
from apps.api.app.integrations.base import BaseIntegrationProvider
from apps.api.app.core.config import settings
from apps.api.app.core.encryption import decrypt_token

logger = logging.getLogger(__name__)


class WhatsAppProvider(BaseIntegrationProvider):
    def __init__(
        self,
        access_token: Optional[str] = None,
        phone_number_id: Optional[str] = None,
        app_secret: Optional[str] = None,
        verify_token: Optional[str] = None,
        db: Optional[Any] = None,
        business_id: Optional[str] = None,
    ):
        self.access_token = access_token
        self.phone_number_id = phone_number_id

        # If business_id is provided, check if the business has custom Meta Cloud API credentials saved
        if db and business_id and not self.access_token:
            from apps.api.app.models.models import Integration
            integ = db.query(Integration).filter(
                Integration.business_id == business_id,
                Integration.provider == "whatsapp"
            ).first()
            if integ and integ.access_token_encrypted:
                try:
                    decrypted = decrypt_token(integ.access_token_encrypted)
                    if decrypted and not decrypted.startswith("meta_cloud_verified"):
                        self.access_token = decrypted
                    meta_info = integ.metadata_info or {}
                    custom_pid = meta_info.get("phone_number_id")
                    if custom_pid and custom_pid != "waba_prod_001":
                        self.phone_number_id = custom_pid
                except Exception:
                    pass

        # Fallback to system-level settings if not overridden
        self.access_token = self.access_token or settings.META_ACCESS_TOKEN
        self.phone_number_id = self.phone_number_id or settings.META_PHONE_NUMBER_ID
        self.app_secret = app_secret or settings.META_APP_SECRET
        self.verify_token = verify_token or settings.META_VERIFY_TOKEN
        self.api_version = "v20.0"
        self.base_url = f"https://graph.facebook.com/{self.api_version}"

    def is_meta_api_configured(self) -> bool:
        return bool(self.access_token and self.phone_number_id and len(self.access_token) > 20 and not self.access_token.startswith("meta_cloud_verified"))

    def verify_webhook_challenge(self, mode: str, token: str, challenge: str) -> Optional[str]:
        """Validates Meta's webhook challenge handshake."""
        if mode == "subscribe" and token == self.verify_token:
            return challenge
        return None

    def verify_payload_signature(self, raw_body: bytes, signature_header: Optional[str]) -> bool:
        """Validates the HMAC-SHA256 signature from Meta webhook requests."""
        if not self.app_secret:
            return True
        if not signature_header or not signature_header.startswith("sha256="):
            return False

        expected_hash = signature_header.split("sha256=")[1]
        mac = hmac.new(self.app_secret.encode("utf-8"), msg=raw_body, digestmod=hashlib.sha256)
        computed_hash = mac.hexdigest()
        return hmac.compare_digest(computed_hash, expected_hash)

    async def send_text_message(self, recipient_phone: str, text: str) -> Dict[str, Any]:
        """Sends an outbound WhatsApp text message using the Meta Cloud API."""
        clean_phone = recipient_phone.replace("+", "").replace("-", "").replace(" ", "")

        if not self.is_meta_api_configured():
            logger.info(f"WhatsApp Meta token not configured. Simulating delivery to {recipient_phone}.")
            return {
                "success": True,
                "simulated": True,
                "recipient": recipient_phone,
                "message_preview": text[:100],
                "meta_configured": False,
                "note": "Number is registered in LeadFlow AI. To send live WhatsApp packets, provide Meta System User Token.",
            }

        url = f"{self.base_url}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_phone,
            "type": "text",
            "text": {"preview_url": False, "body": text},
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                resp_json = response.json()
                if response.status_code == 200:
                    logger.info(f"✓ Real WhatsApp message delivered to {recipient_phone}")
                    return {"success": True, "simulated": False, "meta_response": resp_json}
                else:
                    logger.error(f"Meta Graph API error for {recipient_phone}: {resp_json}")
                    return {
                        "success": False,
                        "simulated": False,
                        "status_code": response.status_code,
                        "meta_error": resp_json.get("error", {}).get("message", response.text),
                    }
            except Exception as e:
                logger.error(f"Failed to send WhatsApp message to {recipient_phone}: {str(e)}")
                return {"success": False, "error": str(e)}

    async def connect(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        self.access_token = credentials.get("access_token")
        self.phone_number_id = credentials.get("phone_number_id")
        return await self.health_check()

    async def disconnect(self) -> bool:
        self.access_token = None
        return True

    async def health_check(self) -> Dict[str, Any]:
        if not self.is_meta_api_configured():
            return {
                "status": "ready_unverified",
                "configured": False,
                "message": "Business number is registered in LeadFlow database. Meta Cloud API token is not yet attached."
            }
        
        url = f"{self.base_url}/{self.phone_number_id}"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    return {"status": "healthy", "configured": True, "details": resp.json()}
                return {"status": "meta_error", "configured": True, "details": resp.json()}
            except Exception as e:
                return {"status": "error", "configured": True, "error": str(e)}
