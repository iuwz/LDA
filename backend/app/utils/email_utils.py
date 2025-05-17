"""
Utility helpers for sending transactional e-mails via the external
EC2 “email-worker” service.

RELEASE 2.4 • 2025-05-17
‣ Every resend carries a unique RFC-5322 Message-ID header.
‣ Plain-text body now includes a random nonce → providers can’t
  drop it as a duplicate even if they hash the plain part only.
"""

from __future__ import annotations

import os
import logging
import requests
from random import randint
from datetime import datetime, timezone
from uuid import uuid4

# ---------------------------------------------------------------------

EMAIL_WORKER_URL = os.getenv("EMAIL_WORKER_URL", "")
HEADERS = {"Content-Type": "application/json"}
DOMAIN = os.getenv("MAIL_DOMAIN", "lda-legal.com")  # fallback if not set


def _post_email(payload: dict) -> None:
    """Forward JSON to the email-worker; raise on any HTTP error."""
    try:
        resp = requests.post(
            f"{EMAIL_WORKER_URL}/send-email",
            json=payload,
            headers=HEADERS,
            timeout=10,
        )
        resp.raise_for_status()
    except Exception:
        logging.exception("Email-worker POST failed")
        raise RuntimeError("Email service unavailable")


def random_code() -> str:
    """Return a zero-padded 6-digit verification code (e.g. '042519')."""
    return f"{randint(0, 999_999):06d}"


# ───────────────────────── Password-reset ────────────────────────────
def send_reset_email(to_email: str, reset_link: str) -> None:
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


# ───────────────────────── Verification code ─────────────────────────
def _unique_headers() -> dict[str, str]:
    """
    Generate headers that guarantee SMTP-level uniqueness:
      • Message-ID with UUID and high-resolution UTC timestamp
      • X-LDA-Mail-UUID for extra debugging on the worker
    """
    uid = uuid4().hex
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S.%f")
    msg_id = f"<{uid}.{ts}@{DOMAIN}>"
    return {
        "Message-ID": msg_id,       # honoured by most providers
        "X-LDA-Mail-UUID": uid,     # logged by our email-worker
    }


def send_verification_email(to_email: str, code: str) -> None:
    """
    Send a 6-digit verification code.

    Each call:
      • Crafts a brand-new Message-ID header.
      • Appends an invisible HTML comment holding a UUID so the HTML
        body is always different.
      • Adds the same UUID to the plain-text part ( [id:…] ) so providers
        that hash only text/plain still see a unique body.
    """
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    subject = f"Your Verification Code – {code} · {now}"

    nonce = uuid4().hex  # single nonce used in plain + HTML

    payload = {
        "to_email": to_email,
        "subject": subject,
        "plain": (
            f"Your verification code is {code}\n\n"
            "This code will expire in 10 minutes."
            f"\n[id:{nonce}]"                # ← makes plain part unique
        ),
        "html": (
            "<p>Hello,</p>"
            "<p>Your verification code is:</p>"
            f"<h2>{code}</h2>"
            "<p>This code will expire in 10&nbsp;minutes.</p>"
            f"<!-- {nonce} -->"              # keeps HTML unique
        ),
        "headers": _unique_headers(),
    }
    _post_email(payload)


# ───────────────────── Contact-form relay ────────────────────────────
def send_contact_email(name: str, email: str, subject: str, message: str) -> None:
    support_addr = os.getenv("SUPPORT_EMAIL", "support@lda-legal.com")

    plaintext = (
        "New contact-form submission\n"
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
        "headers": _unique_headers(),
    }
    _post_email(payload)
