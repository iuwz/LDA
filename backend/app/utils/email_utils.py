# backend/app/utils/email_utils.py
"""
Utility helpers for sending transactional e-mails via the external
EC2 “email-worker” service.

RELEASE 2.1 • 2025-05-17
‣ Verification e-mail subject now includes the code, ensuring providers
  don’t silently drop or merge consecutive “Resend” messages.
"""

import os
import logging
import requests
from random import randint

# URL of the EC2 email-worker (set in Render /.env or Docker secrets)
EMAIL_WORKER_URL = os.getenv("EMAIL_WORKER_URL", "")
HEADERS = {"Content-Type": "application/json"}


# ─────────────────────────── helpers ────────────────────────────
def _post_email(payload: dict) -> None:
    """
    Forward a JSON payload to the email-worker.
    Raises RuntimeError on *any* failure so the caller can surface a
    5xx / 4xx to the front-end.
    """
    try:
        resp = requests.post(
            f"{EMAIL_WORKER_URL}/send-email",
            json=payload,
            headers=HEADERS,
            timeout=5,
        )
        resp.raise_for_status()
    except Exception:
        logging.exception("Email-worker POST failed")
        raise RuntimeError("Email service unavailable")


def random_code() -> str:
    """Return a zero-padded 6-digit verification code (e.g. '042519')."""
    return f"{randint(0, 999_999):06d}"


# ───────────────────── password-reset flow ──────────────────────
def send_reset_email(to_email: str, reset_link: str) -> None:
    """
    Send a password-reset email via the EC2 worker.
    """
    payload = {
        "to_email": to_email,
        "subject": "Password Reset Request",
        "plain": (
            "Hello,\n\n"
            f"Reset link: {reset_link}\n\n"
            "If you did not request this, please ignore this e-mail."
        ),
        "html": (
            "<p>Hello,</p>"
            "<p>You requested a password reset. Click the link below:</p>"
            f'<p><a href="{reset_link}">{reset_link}</a></p>'
            "<p>If you did not request this, please ignore this e-mail.</p>"
        ),
    }
    _post_email(payload)


# ───────────────────── verification code flow ───────────────────
def send_verification_email(to_email: str, code: str) -> None:
    """
    Send a 6-digit e-mail-verification code.

    **Uniqueness tweak (2025-05-17):**
    – Subject line now contains the code itself so that providers
      treat every resend as a brand-new message and don’t collapse it
      into the previous thread.
    """
    subject = f"Your Verification Code – {code}"

    payload = {
        "to_email": to_email,
        "subject": subject,
        "plain": (
            f"Your verification code is {code}\n\n"
            "This code will expire in 10 minutes."
        ),
        "html": (
            "<p>Hello,</p>"
            "<p>Your verification code is:</p>"
            f"<h2>{code}</h2>"
            "<p>This code will expire in 10&nbsp;minutes.</p>"
        ),
    }
    _post_email(payload)


# ──────────────────── contact-form forwarding ───────────────────
def send_contact_email(name: str, email: str, subject: str, message: str) -> None:
    """
    Forward a contact-form submission to the support inbox.
    """
    support_addr = os.getenv("SUPPORT_EMAIL", "support@lda-legal.com")

    plaintext = (
        f"New contact-form submission\n"
        f"Name   : {name}\n"
        f"Email  : {email}\n"
        f"Subject: {subject}\n\n"
        f"Message:\n{message}"
    )

    html = (
        "<p><strong>New contact-form submission</strong></p>"
        f"<p><strong>Name&nbsp;&nbsp;&nbsp;:</strong> {name}<br>"
        f"<strong>Email&nbsp;&nbsp;&nbsp;:</strong> {email}<br>"
        f"<strong>Subject :</strong> {subject}</p>"
        f"<pre style='font-family: monospace'>{message}</pre>"
    )

    payload = {
        "to_email": support_addr,
        "subject": f"[LDA Contact] {subject}",
        "plain": plaintext,
        "html": html,
    }
    _post_email(payload)
