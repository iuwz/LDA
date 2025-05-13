# backend/app/utils/email_utils.py

import os
import logging
import requests
from random import randint

# URL of your EC2 email‐worker (set in Render / .env)
EMAIL_WORKER_URL = os.getenv("EMAIL_WORKER_URL")
HEADERS = {"Content-Type": "application/json"}

def _post_email(payload: dict) -> None:
    """
    Send the JSON payload to the EC2 email worker.
    Raises RuntimeError on any failure.
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
    """Return a zero-padded 6-digit verification code, e.g. '042519'."""
    return f"{randint(0, 999_999):06d}"

def send_reset_email(to_email: str, reset_link: str) -> None:
    """
    Send a password-reset e-mail by calling the EC2 worker.
    """
    payload = {
        "to_email": to_email,
        "subject": "Password Reset Request",
        "plain": (
            "Hello,\n\n"
            f"Reset link: {reset_link}\n\n"
            "If you did not request this, please ignore this email."
        ),
        "html": (
            "<p>Hello,</p>"
            "<p>You requested a password reset. Click the link below:</p>"
            f'<p><a href="{reset_link}">{reset_link}</a></p>'
            "<p>If you did not request this, please ignore this email.</p>"
        ),
    }
    _post_email(payload)

def send_verification_email(to_email: str, code: str) -> None:
    """
    Send a 6-digit e-mail verification code by calling the EC2 worker.
    """
    payload = {
        "to_email": to_email,
        "subject": "Your Verification Code",
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
