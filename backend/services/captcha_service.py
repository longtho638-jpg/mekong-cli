import logging
from typing import Optional

import httpx

from backend.api.config.settings import settings

logger = logging.getLogger(__name__)


class CaptchaService:
    """
    Service for validating CAPTCHA tokens (hCaptcha or reCAPTCHA).
    """

    def __init__(self):
        self.secret_key = settings.captcha_secret_key
        self.site_key = settings.captcha_site_key
        self.provider = settings.captcha_provider  # 'hcaptcha' or 'recaptcha'
        self.verify_url = self._get_verify_url()

    def _get_verify_url(self) -> str:
        if self.provider == "hcaptcha":
            return "https://hcaptcha.com/siteverify"
        elif self.provider == "recaptcha":
            return "https://www.google.com/recaptcha/api/siteverify"
        else:
            # Default to hcaptcha if not specified
            return "https://hcaptcha.com/siteverify"

    async def verify_token(self, token: str, remote_ip: Optional[str] = None) -> bool:
        """
        Verify the CAPTCHA token with the provider.
        """
        if not self.secret_key:
            logger.warning(
                "CAPTCHA secret key not configured. Skipping validation (allowing request)."
            )
            return True

        if not token:
            logger.warning("CAPTCHA token missing.")
            return False

        try:
            data = {"secret": self.secret_key, "response": token}
            if remote_ip:
                data["remoteip"] = remote_ip

            async with httpx.AsyncClient() as client:
                response = await client.post(self.verify_url, data=data)
                response.raise_for_status()
                result = response.json()

                if result.get("success"):
                    return True
                else:
                    logger.warning(f"CAPTCHA validation failed: {result.get('error-codes')}")
                    return False

        except Exception as e:
            logger.error(f"Error validating CAPTCHA: {e}")
            # Fail open or closed depending on policy?
            # Usually fail open (allow) if external service is down to avoid blocking legit users,
            # unless under active attack.
            return True


captcha_service = CaptchaService()
