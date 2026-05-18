"""
Email service using Resend REST API via httpx.
No new dependencies required — httpx is already in requirements.txt.
Graceful degradation if RESEND_API_KEY is not set.
"""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

_RESEND_URL = "https://api.resend.com/emails"
_FROM = os.getenv("EMAIL_FROM", "KINEXIS <onboarding@atollom.com>")
_DASHBOARD_URL = os.getenv("DASHBOARD_URL", "https://dashboard.atollom.com")


async def send_welcome_email(
    to_email: str,
    full_name: str,
    company_name: str,
    temp_password: str,
) -> bool:
    """Sends welcome email with temporary password. Returns True on success."""
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        logger.warning(
            "[EMAIL] RESEND_API_KEY not set — skipping welcome email to %s", to_email
        )
        return False

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                _RESEND_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": _FROM,
                    "to": [to_email],
                    "subject": f"Bienvenido a KINEXIS — {company_name}",
                    "html": _welcome_html(
                        to_email, full_name, company_name, temp_password
                    ),
                },
            )
        if resp.status_code in (200, 201):
            logger.info("[EMAIL] Welcome email sent to %s", to_email)
            return True
        logger.error("[EMAIL] Resend error %d: %s", resp.status_code, resp.text)
        return False
    except Exception as exc:
        logger.error("[EMAIL] Failed sending to %s: %s", to_email, exc)
        return False


def _welcome_html(
    email: str, full_name: str, company_name: str, temp_password: str
) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;">
    <tr>
      <td style="background:linear-gradient(135deg,#16a34a,#14532d);padding:36px;border-radius:16px 16px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:-0.5px;">KINEXIS</h1>
        <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:14px;">Plataforma Operativa · {company_name}</p>
      </td>
    </tr>
    <tr>
      <td style="background:#fff;padding:36px;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;border-top:0;">
        <h2 style="color:#111827;margin:0 0 16px;font-size:20px;">Hola, {full_name} 👋</h2>
        <p style="color:#4b5563;margin:0 0 24px;line-height:1.6;">
          Tu cuenta en KINEXIS está lista. Usa las siguientes credenciales para tu primer acceso:
        </p>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #16a34a;border-radius:12px;padding:20px;margin:0 0 24px;">
          <p style="margin:0 0 10px;font-size:14px;color:#374151;">
            <strong>Email:</strong>&nbsp;
            <code style="color:#16a34a;">{email}</code>
          </p>
          <p style="margin:0;font-size:14px;color:#374151;">
            <strong>Contraseña temporal:</strong>&nbsp;
            <code style="background:#fff;padding:5px 10px;border-radius:6px;font-size:15px;color:#111827;border:1px solid #d1d5db;letter-spacing:1px;">{temp_password}</code>
          </p>
        </div>

        <p style="color:#dc2626;font-size:13px;margin:0 0 28px;">
          ⚠️ Esta contraseña es temporal. Cámbiala en tu primer inicio de sesión.
        </p>

        <div style="text-align:center;margin:0 0 32px;">
          <a href="{_DASHBOARD_URL}"
             style="display:inline-block;background:#16a34a;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
            Acceder al Dashboard →
          </a>
        </div>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;">
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
          KINEXIS by Atollom Labs ·
          <a href="mailto:soporte@atollom.com" style="color:#16a34a;text-decoration:none;">soporte@atollom.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>"""
