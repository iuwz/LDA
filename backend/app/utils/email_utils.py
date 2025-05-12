# backend/app/utils/email_utils.py
import os, logging
from mailersend import emails                # ← NEW

API_TOKEN = os.getenv("MAILERSEND_API_TOKEN")
FROM_EMAIL = os.getenv("FROM_EMAIL")

if not API_TOKEN or not FROM_EMAIL:
    raise RuntimeError(
        "MAILERSEND_API_TOKEN and FROM_EMAIL must be set in the environment."
    )

_mailer = emails.NewEmail(API_TOKEN)          # auth happens here

def send_reset_email(to_email: str, reset_link: str) -> None:
    """
    Deliver a password-reset message via MailerSend HTTP API.
    Raises RuntimeError on failure so /forgot-password can return 500.
    """
    mail = {
        "from": {"email": FROM_EMAIL, "name": "Legal Doc Analyzer"},
        "to":   [{"email": to_email}],
        "subject": "Password Reset Request",
    }

    if TEMPLATE_ID:             # use a stored template with a variable
        mail["template_id"] = TEMPLATE_ID
        mail["variables"] = [
            {
                "email": to_email,
                "substitutions": [
                    {"var": "reset_link", "value": reset_link}
                ],
            }
        ]
    else:                       # plain HTML / text fallback
        html = (
            "<p>Hello,</p>"
            "<p>You requested a password reset. Click the link below:</p>"
            f'<p><a href="{reset_link}">{reset_link}</a></p>'
            "<p>If you did not request this, please ignore this email.</p>"
        )
        mail["html"] = html
        mail["text"] = (
            "Hello,\n\n"
            "You requested a password reset.\n"
            f"Reset link: {reset_link}\n\n"
            "If you did not request this, please ignore this email."
        )

    try:
        _mailer.send(mail)      # MailerSend returns 202 on success
    except Exception as exc:
        logging.exception("MailerSend error")
        raise RuntimeError("Email service unavailable") from exc
