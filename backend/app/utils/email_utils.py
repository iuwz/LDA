# backend/app/utils/email_utils.py
"""
Outgoing-e-mail helpers for the Legal Document Analyzer backend.

Covers
  • password-reset links
  • 6-digit sign-up verification codes

Key point: MailerSend’s SDK can return several shapes on success
(int 202, str '202', bytes b'202\\n', object with .status_code == 202,
or a JSON dict containing "message_id").  `_send_and_assert()` now
normalises all of them so we no longer raise false 500s even though the
mail was actually delivered.
"""

import os
import logging
from typing import Optional
from random import randint

from mailersend import emails

# ── ENVIRONMENT ──────────────────────────────────────────────────
API_TOKEN   = os.getenv("MAILERSEND_API_TOKEN")
FROM_EMAIL  = os.getenv("FROM_EMAIL")
TEMPLATE_ID: Optional[str] = os.getenv("MAILERSEND_TEMPLATE_ID")

if not API_TOKEN or not FROM_EMAIL:
    raise RuntimeError(
        "MAILERSEND_API_TOKEN and FROM_EMAIL must be set in the environment."
    )

# Single client instance
_mailer = emails.NewEmail(API_TOKEN)

# ───────────────────────── SHARED SENDER ────────────────────────
def _send_and_assert(payload: dict) -> None:
    """
    Send the prepared `payload` and raise RuntimeError on any *real*
    error.  Accept the following as success:
      • int 202
      • str / bytes that decode/str() to '202'
      • object with attr .status_code == 202
      • dict with key "message_id"
    """
    try:
        resp = _mailer.send(payload)

        # Convert every sensible return shape into a plain status string
        if isinstance(resp, bytes):
            status = resp.decode().strip()
        elif isinstance(resp, str):
            status = resp.strip()
        elif hasattr(resp, "status_code"):
            status = str(resp.status_code).strip()
        elif isinstance(resp, int):
            status = str(resp)
        else:
            status = ""

        if status == "202" or (isinstance(resp, dict) and "message_id" in resp):
            return  # ← success

        raise RuntimeError(f"MailerSend unexpected response: {resp!r}")

    except Exception as exc:
        logging.exception("MailerSend failure")
        raise RuntimeError("Email service unavailable") from exc


# ─────────────────────── PASSWORD-RESET MAIL ────────────────────
def send_reset_email(to_email: str, reset_link: str) -> None:
    """Send a password-reset e-mail with `reset_link`."""
    payload: dict = {}

    # From / To
    _mailer.set_mail_from({"email": FROM_EMAIL, "name": "Legal Doc Analyzer"}, payload)
    _mailer.set_mail_to([{"email": to_email}], payload)

    # Content (template or inline)
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

    _send_and_assert(payload)


# ────────────────────── VERIFICATION-CODE MAIL ──────────────────
def random_code() -> str:
    """Return a zero-padded 6-digit verification code, e.g. '042519'."""
    return f"{randint(0, 999_999):06d}"


def send_verification_email(to_email: str, code: str) -> None:
    """Send a 6-digit e-mail verification `code` to `to_email`."""
    payload: dict = {}

    # From / To
    _mailer.set_mail_from({"email": FROM_EMAIL, "name": "Legal Doc Analyzer"}, payload)
    _mailer.set_mail_to([{"email": to_email}], payload)

    # Subject & body (feel free to swap for a template)
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

    _send_and_assert(payload)
