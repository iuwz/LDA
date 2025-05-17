"""
Utility helpers for sending transactional e-mails via the external
EC2 “email-worker” service.

RELEASE 2.5 • 2025-05-17
‣ Unique Message-ID now sent in *both* places Nodemailer/SES accept:
    • top-level  messageId="…"
    • custom     headers["Message-ID"]="…"
‣ Plain-text nonce remains → no body-hash duplicates.
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


# ───────────────────────── helpers ──────────────────────────
def _make_msg_id() -> str:
    uid = uuid4().hex
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S.%f")
    return f"<{uid}.{ts}@{DOMAIN}>"


# ───────────────────────── Password-reset ───────────────────
def send_reset_email(to_email: str, reset_link: str) -> None:
    msg_id = _make_msg_id()

    payload = {
        "to_email": to_email,
        "subject": "Password Reset Request",
        "messageId": msg_id,                # ← NEW (top-level)
        "headers": {"Message-ID": msg_id},  # echoed for logging
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


# ───────────────────────── Verification code ────────────────
def send_verification_email(to_email: str, code: str) -> None:
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    subject = f"Your Verification Code – {code} · {now}"

    nonce = uuid4().hex
    msg_id = _make_msg_id()

    payload = {
        "to_email": to_email,
        "subject": subject,
        "messageId": msg_id,                # ← NEW (top-level)
        "headers": {                        # still logged by the worker
            "Message-ID": msg_id,
            "X-LDA-Mail-UUID": nonce,
        },
        "plain": (
            f"Your verification code is {code}\n\n"
            "This code will expire in 10 minutes."
            f"\n[id:{nonce}]"
        ),
        "html": (
            "<p>Hello,</p>"
            "<p>Your verification code is:</p>"
            f"<h2>{code}</h2>"
            "<p>This code will expire in 10&nbsp;minutes.</p>"
            f"<!-- {nonce} -->"
        ),
    }
    _post_email(payload)


# ───────────────────── Contact-form relay ───────────────────
def send_contact_email(name: str, email: str, subject: str, message: str) -> None:
    support_addr = os.getenv("SUPPORT_EMAIL", "support@lda-legal.com")

    msg_id = _make_msg_id()

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
        "messageId": msg_id,
        "headers": {"Message-ID": msg_id},
        "plain": plaintext,
        "html": html,
    }
    _post_email(payload)
