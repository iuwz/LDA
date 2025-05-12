# backend/app/utils/email_utils.py
"""
Centralised helpers for all outgoing MailerSend e-mails:
• password-reset links
• 6-digit account-verification codes
The two helpers both build a *payload* dict and call `_mailer.send(payload)`
because MailerSend’s SDK requires the argument – omitting it yields a 500.
"""

import os
import logging
from typing import Optional
from random import randint

from mailersend import emails

# ── ENV VARS ────────────────────────────────────────────────────
API_TOKEN = os.getenv("MAILERSEND_API_TOKEN")
FROM_EMAIL = os.getenv("FROM_EMAIL")
TEMPLATE_ID: Optional[str] = os.getenv("MAILERSEND_TEMPLATE_ID")

if not API_TOKEN or not FROM_EMAIL:
    raise RuntimeError(
        "MAILERSEND_API_TOKEN and FROM_EMAIL must be set in the environment."
    )

# single MailerSend client instance
_mailer = emails.NewEmail(API_TOKEN)

# ────────────────────────────────────────────────────────────────
def _send_and_assert(payload: dict) -> None:
    """
    Low-level wrapper – sends the payload and raises RuntimeError on
    any non-202 response so callers can surface e-mail failures cleanly.
    """
    try:
        resp = _mailer.send(payload)
        if not (
            resp == 202
            or (hasattr(resp, "status_code") and resp.status_code == 202)
            or (isinstance(resp, dict) and "message_id" in resp)
        ):
            raise RuntimeError(f"MailerSend unexpected response: {resp!r}")
    except Exception as exc:                       # network / SDK / HTTP …
        logging.exception("MailerSend failure")
        raise RuntimeError("Email service unavailable") from exc


# ───────────────────────── RESET PASSWORD ───────────────────────
def send_reset_email(to_email: str, reset_link: str) -> None:
    """Send password-reset e-mail with a link valid for one use."""
    payload: dict = {}

    # From / To
    _mailer.set_mail_from({"email": FROM_EMAIL, "name": "Legal Doc Analyzer"}, payload)
    _mailer.set_mail_to([{"email": to_email}], payload)

    # Content
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

    # Send
    _send_and_assert(payload)


# ─────────────────────── 6-DIGIT VERIFICATION CODE ──────────────
def random_code() -> str:
    """Utility used elsewhere: returns a zero-padded 6-digit code, e.g. '042519'."""
    return f"{randint(0, 999_999):06d}"


def send_verification_email(to_email: str, code: str) -> None:
    """
    Send a 6-digit account-verification code.
    The mail uses plain HTML/ text – replace with a template ID if you prefer.
    """
    payload: dict = {}

    # From / To
    _mailer.set_mail_from({"email": FROM_EMAIL, "name": "Legal Doc Analyzer"}, payload)
    _mailer.set_mail_to([{"email": to_email}], payload)

    # Subject & body
    _mailer.set_subject("Your verification code", payload)
    html = (
        "<p>Hello,</p>"
        "<p>Your verification code is:</p>"
        f"<h2>{code}</h2>"
        "<p>This code will expire in 10&nbsp;minutes.</p>"
    )
    _mailer.set_html_content(html, payload)
    _mailer.set_plaintext_content(
        f"Your verification code is {code}\n\n"
        "This code will expire in 10 minutes.",
        payload,
    )

    # Send
    _send_and_assert(payload)
