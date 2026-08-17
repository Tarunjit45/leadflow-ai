import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from apps.api.app.core.config import settings

logger = logging.getLogger("leadflow_email")


class EmailService:
    @staticmethod
    def _is_smtp_configured() -> bool:
        smtp_host = getattr(settings, "SMTP_HOST", None)
        smtp_user = getattr(settings, "SMTP_USER", None)
        return bool(smtp_host and smtp_user)

    @classmethod
    def send_email(
        cls,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> bool:
        from_email = getattr(settings, "EMAILS_FROM_EMAIL", "support@leadflow.ai")
        from_name = getattr(settings, "EMAILS_FROM_NAME", "LeadFlow AI")
        sender = f"{from_name} <{from_email}>"

        if not cls._is_smtp_configured():
            logger.info(f"✉️ [DEV EMAIL DISPATCH] To: {to_email} | Subject: '{subject}'")
            # In development/test mode without SMTP server, log dispatch cleanly
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = sender
            msg["To"] = to_email

            if text_content:
                msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            smtp_host = getattr(settings, "SMTP_HOST", "smtp.gmail.com")
            smtp_port = int(getattr(settings, "SMTP_PORT", 587))
            smtp_user = getattr(settings, "SMTP_USER", "")
            smtp_password = getattr(settings, "SMTP_PASSWORD", "")
            use_tls = getattr(settings, "SMTP_TLS", True)

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                if use_tls:
                    server.starttls()
                if smtp_user and smtp_password:
                    server.login(smtp_user, smtp_password)
                server.sendmail(from_email, [to_email], msg.as_string())

            logger.info(f"✓ Real email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    @classmethod
    def send_verification_email(cls, to_email: str, name: str, token: str, app_url: str) -> bool:
        base = app_url.rstrip("/")
        verify_url = f"{base}/verify-email?token={token}"
        subject = "Verify your email address — LeadFlow AI"

        text_content = f"""Hi {name or 'there'},

Welcome to LeadFlow AI! Please verify your email address to activate your 24/7 AI employee workspace:

{verify_url}

This verification link will expire in 24 hours. If you did not create a LeadFlow AI account, please disregard this message.

Best regards,
The LeadFlow AI Team
"""

        html_content = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 40px 20px; }}
.card {{ max-width: 520px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 36px; }}
.btn {{ display: inline-block; background: #0284c7; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; margin: 24px 0; }}
.footer {{ font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid #1e293b; pt: 16px; }}
</style></head>
<body>
<div class="card">
  <div style="font-size: 20px; font-weight: 800; color: #38bdf8; margin-bottom: 20px;">🤖 LeadFlow AI</div>
  <h2 style="color: #ffffff; margin-top: 0;">Verify your email address</h2>
  <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
    Hi {name or 'there'},<br><br>
    Thank you for registering. Please click the button below to verify your email and activate your business workspace:
  </p>
  <div style="text-align: center;">
    <a href="{verify_url}" class="btn">Verify My Email</a>
  </div>
  <p style="font-size: 12px; color: #94a3b8;">
    Or copy and paste this link in your browser:<br>
    <a href="{verify_url}" style="color: #38bdf8; word-break: break-all;">{verify_url}</a>
  </p>
  <div class="footer">
    This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
  </div>
</div>
</body></html>"""

        return cls.send_email(to_email, subject, html_content, text_content)

    @classmethod
    def send_password_reset_email(cls, to_email: str, name: str, token: str, app_url: str) -> bool:
        base = app_url.rstrip("/")
        reset_url = f"{base}/reset-password?token={token}"
        subject = "Reset your LeadFlow AI password"

        text_content = f"""Hi {name or 'there'},

We received a request to reset your password for your LeadFlow AI workspace.

Click the link below to set a new password:
{reset_url}

This link is single-use and will expire in 1 hour. If you did not request a password reset, no action is needed.

Best regards,
The LeadFlow AI Team
"""

        html_content = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 40px 20px; }}
.card {{ max-width: 520px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 36px; }}
.btn {{ display: inline-block; background: #0284c7; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; margin: 24px 0; }}
.footer {{ font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid #1e293b; pt: 16px; }}
</style></head>
<body>
<div class="card">
  <div style="font-size: 20px; font-weight: 800; color: #38bdf8; margin-bottom: 20px;">🤖 LeadFlow AI</div>
  <h2 style="color: #ffffff; margin-top: 0;">Reset your password</h2>
  <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
    Hi {name or 'there'},<br><br>
    We received a request to reset your password. Click the button below to choose a new secure password:
  </p>
  <div style="text-align: center;">
    <a href="{reset_url}" class="btn">Reset Password</a>
  </div>
  <p style="font-size: 12px; color: #94a3b8;">
    Or copy and paste this link in your browser:<br>
    <a href="{reset_url}" style="color: #38bdf8; word-break: break-all;">{reset_url}</a>
  </p>
  <div class="footer">
    This link is single-use and expires in 1 hour. If you didn't request this reset, your account is safe and you can ignore this email.
  </div>
</div>
</body></html>"""

        return cls.send_email(to_email, subject, html_content, text_content)

    @classmethod
    def send_welcome_email(cls, to_email: str, name: str, business_name: str, app_url: str) -> bool:
        base = app_url.rstrip("/")
        dashboard_url = f"{base}/dashboard"
        subject = f"Welcome to LeadFlow AI — {business_name} workspace ready"

        text_content = f"""Hi {name},

Your LeadFlow AI workspace for '{business_name}' is verified and ready.

You can now configure your AI employee, train it with your services and prices, and connect your WhatsApp channel:
{dashboard_url}

Best regards,
The LeadFlow AI Team
"""

        html_content = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 40px 20px; }}
.card {{ max-width: 520px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 36px; }}
.btn {{ display: inline-block; background: #10b981; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; margin: 24px 0; }}
</style></head>
<body>
<div class="card">
  <div style="font-size: 20px; font-weight: 800; color: #10b981; margin-bottom: 20px;">✓ LeadFlow AI</div>
  <h2 style="color: #ffffff; margin-top: 0;">Your workspace is ready!</h2>
  <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
    Hi {name},<br><br>
    Your email has been verified and your business workspace for <strong>{business_name}</strong> is now active.
  </p>
  <div style="text-align: center;">
    <a href="{dashboard_url}" class="btn">Open My Dashboard</a>
  </div>
</div>
</body></html>"""

        return cls.send_email(to_email, subject, html_content, text_content)
