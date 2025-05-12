# backend/app/utils/email_utils.py
import os, logging
from typing import Optional
from mailersend import emails

API_TOKEN   = os.getenv("MAILERSEND_API_TOKEN")
FROM_EMAIL  = os.getenv("FROM_EMAIL")
TEMPLATE_ID: Optional[str] = os.getenv("MAILERSEND_TEMPLATE_ID")  # optional

if not API_TOKEN or not FROM_EMAIL:
    raise RuntimeError(
        "MAILERSEND_API_TOKEN and FROM_EMAIL must be set in the environment."
    )

_mailer = emails.NewEmail(API_TOKEN)


def send_reset_email(to_email: str, reset_link: str) -> None:
    """Send password‑reset email via MailerSend HTTP API."""
    payload: dict = {}

    # ── From / To ──────────────────────────────────────────
    _mailer.set_mail_from(
        {"email": FROM_EMAIL, "name": "Legal Doc Analyzer"}, payload
    )
    _mailer.set_mail_to([{"email": to_email}], payload)

    # ── Content ───────────────────────────────────────────
    if TEMPLATE_ID:
        _mailer.set_template_id(TEMPLATE_ID, payload)
        _mailer.set_variables(
            [
                {
                    "email": to_email,
                    "substitutions": [
                        {"var": "reset_link", "value": reset_link}
                    ],
                }
            ],
            payload,
        )
    else:
        _mailer.set_subject("Password Reset Request", payload)
        html = (
            "<p>Hello,</p>"
            "<p>You requested a password reset. Click the link below:</p>"
            f'<p><a href="{reset_link}">{reset_link}</a></p>'
            "<p>If you did not request this, please ignore this email.</p>"
        )
        _mailer.set_html_content(html, payload)
        _mailer.set_plaintext_content(
            f"Hello,\n\nReset link: {reset_link}\n\n"
            "If you did not request this, please ignore this email.",
            payload,
        )

        # ── Send ──────────────────────────────────────────────
    try:
        resp = _mailer.send(payload)          # ➜ 202 or dict{"message_id": …}

        # ▸ Accept all “obvious success” shapes
        if (
            resp == 202                                  # int
            or (hasattr(resp, "status_code") and resp.status_code == 202)  # SDK resp obj
            or (isinstance(resp, dict) and "message_id" in resp)           # HTTP JSON
        ):
            return                                       # ← success, nothing to raise

        # Anything else is suspicious
        raise RuntimeError(f"MailerSend unexpected response: {resp!r}")

    except Exception as exc:
        logging.exception("MailerSend failure")
        raise RuntimeError("Email service unavailable") from exc

