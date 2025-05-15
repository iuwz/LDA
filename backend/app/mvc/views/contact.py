# backend/app/mvc/views/contact.py
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, constr

from backend.app.utils.email_utils import send_contact_email   # ← already exists in utils

router = APIRouter()

class ContactMessage(BaseModel):
    name:    constr(strip_whitespace=True, min_length=1)
    email:   EmailStr
    subject: constr(strip_whitespace=True, min_length=1)
    message: constr(strip_whitespace=True, min_length=1)

@router.post(
    "/",                       # POST /contact
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        204: {"description": "Message forwarded"},
        503: {"description": "E-mail service unavailable"},
    },
)
async def submit_contact(msg: ContactMessage):
    """
    Forward the contact-form submission to the LDA support inbox.
    """
    try:
        send_contact_email(
            name=msg.name,
            email=msg.email,
            subject=msg.subject,
            message=msg.message,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
