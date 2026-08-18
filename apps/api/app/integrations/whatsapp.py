import hmac
import hashlib
import json
import logging
from typing import Any, Dict, List, Optional
import httpx
from apps.api.app.integrations.base import BaseIntegrationProvider
from apps.api.app.core.config import settings
from apps.api.app.core.encryption import decrypt_token, encrypt_token

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
        self.business_id = business_id
        self.waba_id: Optional[str] = None

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
                    self.waba_id = meta_info.get("waba_id")
                except Exception as e:
                    logger.warning(f"Could not decrypt stored token: {e}")

        # Fallback to system-level settings if not overridden
        self.access_token = self.access_token or settings.META_ACCESS_TOKEN
        self.phone_number_id = self.phone_number_id or settings.META_PHONE_NUMBER_ID
        self.app_secret = app_secret or settings.META_APP_SECRET
        self.verify_token = verify_token or settings.META_VERIFY_TOKEN
        self.api_version = "v21.0"
        self.base_url = f"https://graph.facebook.com/{self.api_version}"

    def is_meta_api_configured(self) -> bool:
        return bool(
            self.access_token
            and self.phone_number_id
            and len(self.access_token.strip()) > 20
            and not self.access_token.startswith("meta_cloud_verified")
            and not self.access_token.startswith("meta_token_sim_")
        )

    def get_embedded_signup_config(self) -> Dict[str, Any]:
        """Returns public Meta App ID and Embedded Signup configuration for the frontend SDK."""
        return {
            "app_id": settings.META_APP_ID or "1753893495945396",
            "config_id": settings.META_CONFIG_ID or "1070129732436618",
            "api_version": self.api_version,
            "webhook_url": f"{settings.API_URL.rstrip('/')}/api/v1/webhooks/whatsapp",
            "is_platform_configured": bool(settings.META_APP_ID and settings.META_APP_SECRET),
        }

    async def exchange_embedded_signup_code(
        self,
        code: str,
        waba_id: Optional[str] = None,
        phone_number_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Exchanges short-lived code from Meta's Embedded Signup for a permanent access token,
        queries phone number and WABA details, and subscribes the WABA to LeadFlow webhooks.
        """
        app_id = settings.META_APP_ID or "1753893495945396"
        app_secret = settings.META_APP_SECRET or "861de09805610a7c295f933714829aff"

        if not app_id or not app_secret:
            raise ValueError("Meta App ID or App Secret is not configured in backend environment.")

        # 1. Exchange OAuth code for permanent Access Token
        oauth_url = f"{self.base_url}/oauth/access_token"
        params = {
            "client_id": app_id,
            "client_secret": app_secret,
            "code": code,
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            oauth_res = await client.get(oauth_url, params=params)
            if oauth_res.status_code != 200:
                logger.error(f"Meta OAuth code exchange error: {oauth_res.text}")
                raise ValueError(f"Meta OAuth exchange failed: {oauth_res.json().get('error', {}).get('message', oauth_res.text)}")

            token_data = oauth_res.json()
            user_access_token = token_data.get("access_token")
            if not user_access_token:
                raise ValueError("Meta did not return an access_token in the exchange response.")

            headers = {"Authorization": f"Bearer {user_access_token}"}

            # 2. If phone_number_id wasn't passed, discover it via WABA phone numbers
            target_phone_id = phone_number_id
            target_waba_id = waba_id
            display_phone = None
            verified_name = None
            quality_rating = "UNKNOWN"

            if target_waba_id and not target_phone_id:
                phone_list_url = f"{self.base_url}/{target_waba_id}/phone_numbers"
                p_res = await client.get(phone_list_url, headers=headers)
                if p_res.status_code == 200:
                    p_data = p_res.json().get("data", [])
                    if p_data:
                        target_phone_id = p_data[0].get("id")
                        display_phone = p_data[0].get("display_phone_number")
                        verified_name = p_data[0].get("verified_name")
                        quality_rating = p_data[0].get("quality_rating", "GREEN")

            # 3. If phone_number_id is present, query its verified profile
            if target_phone_id:
                phone_detail_url = f"{self.base_url}/{target_phone_id}?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status"
                pd_res = await client.get(phone_detail_url, headers=headers)
                if pd_res.status_code == 200:
                    pd_data = pd_res.json()
                    display_phone = pd_data.get("display_phone_number") or display_phone
                    verified_name = pd_data.get("verified_name") or verified_name
                    quality_rating = pd_data.get("quality_rating") or quality_rating

            # 4. Subscribe LeadFlow App to WABA webhooks automatically
            if target_waba_id:
                sub_url = f"{self.base_url}/{target_waba_id}/subscribed_apps"
                try:
                    sub_res = await client.post(sub_url, headers=headers)
                    logger.info(f"Subscribed LeadFlow app to WABA {target_waba_id}: status={sub_res.status_code} {sub_res.text}")
                except Exception as e:
                    logger.warning(f"Could not auto-subscribe app to WABA {target_waba_id}: {e}")

            return {
                "success": True,
                "access_token": user_access_token,
                "waba_id": target_waba_id or "waba_embedded",
                "phone_number_id": target_phone_id or "phone_embedded",
                "display_phone_number": display_phone or "Verified WhatsApp",
                "verified_name": verified_name or "Business",
                "quality_rating": quality_rating,
            }

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

    async def send_template_message(self, recipient_phone: str, template_name: str = "hello_world", language_code: str = "en_US") -> Dict[str, Any]:
        """Sends an approved Meta WhatsApp template message."""
        clean_phone = recipient_phone.replace("+", "").replace("-", "").replace(" ", "")
        
        if not self.is_meta_api_configured():
            return {
                "success": False,
                "simulated": True,
                "meta_configured": False,
                "error": "Meta Cloud API Access Token or Phone Number ID is missing. Please attach your Meta Token to send real WhatsApp messages.",
            }

        url = f"{self.base_url}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": clean_phone,
            "type": "template",
            "template": {"name": template_name, "language": {"code": language_code}},
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                resp_json = response.json()
                if response.status_code == 200:
                    logger.info(f"✓ Real WhatsApp template delivered to {recipient_phone}")
                    return {"success": True, "simulated": False, "meta_response": resp_json}
                else:
                    err_code = resp_json.get("error", {}).get("code")
                    err_msg = resp_json.get("error", {}).get("message", response.text)
                    err_details = resp_json.get("error", {}).get("error_data", {}).get("details", "")
                    logger.warning(f"Meta template send error {err_code}: {err_msg} ({err_details})")
                    return {
                        "success": False,
                        "simulated": False,
                        "status_code": response.status_code,
                        "error_code": err_code,
                        "meta_error": err_msg,
                        "details": err_details,
                    }
            except Exception as e:
                return {"success": False, "error": str(e)}

    async def send_text_message(self, recipient_phone: str, text: str) -> Dict[str, Any]:
        """Sends an outbound WhatsApp text message using the Meta Cloud API."""
        clean_phone = recipient_phone.replace("+", "").replace("-", "").replace(" ", "")

        if not self.is_meta_api_configured():
            logger.warning(f"Meta Cloud API token not configured. Cannot send real WhatsApp packet to {recipient_phone}.")
            return {
                "success": False,
                "simulated": True,
                "meta_configured": False,
                "recipient": recipient_phone,
                "error": "Meta Cloud API token is not configured. To send real WhatsApp messages to your phone, please connect your Meta token.",
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
                    err_code = resp_json.get("error", {}).get("code")
                    err_msg = resp_json.get("error", {}).get("message", response.text)
                    err_details = resp_json.get("error", {}).get("error_data", {}).get("details", "")

                    logger.warning(f"Meta Graph API text message returned code {err_code}: {err_msg} ({err_details})")

                    # If Meta requires a template for 24h conversation initiation, attempt hello_world template
                    if err_code in [131047, 131026]:
                        logger.info(f"Attempting fallback template message to {recipient_phone}...")
                        tpl_res = await self.send_template_message(recipient_phone, "hello_world")
                        if tpl_res.get("success"):
                            return {
                                "success": True,
                                "simulated": False,
                                "meta_response": tpl_res.get("meta_response"),
                                "note": "Delivered standard template handshake since 24h customer window was not open.",
                            }

                    return {
                        "success": False,
                        "simulated": False,
                        "status_code": response.status_code,
                        "error_code": err_code,
                        "meta_error": err_msg,
                        "details": err_details,
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
