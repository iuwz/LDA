# backend/app/utils/email_utils.py
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
load_dotenv()
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASS = os.environ.get("SMTP_PASS")

def send_reset_email(to_email: str, reset_link: str):
    subject = "Password Reset Request"
    body = f"""
    <p>Hello,</p>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <p><a href="{reset_link}">{reset_link}</a></p>
    <p>If you did not request this, please ignore this email.</p>
    """

    msg = MIMEMultipart()
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, to_email, msg.as_string())