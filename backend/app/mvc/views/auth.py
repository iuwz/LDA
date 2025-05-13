# backend/app/mvc/views/auth.py
import os
import logging
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr

from backend.app.utils.email_utils import send_reset_email
from backend.app.utils.security import (
    generate_reset_token,
    verify_reset_token,
    get_password_hash,
)
from backend.app.mvc.models.user import User
from backend.app.mvc.controllers.auth import register_user, login_user
from datetime import datetime, timedelta
from random import randint
import logging
from fastapi.concurrency import run_in_threadpool
from passlib.context import CryptContext
from backend.app.utils.email_utils import send_verification_email
router = APIRouter()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
async def register(user: User, request: Request):
    db = request.app.state.db
    try:
        # Create the user
        saved = await register_user(user, db)
        # Auto-login: generate token and set cookie
        auth_result = await login_user(user.email, user.hashed_password, db)
        token = auth_result["access_token"]

        # Prepare response and set auth cookie
        resp = JSONResponse(
            content={
                "message": "User registered and logged in successfully",
                "user": saved.dict(),
            }
        )
        resp.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=True,
            samesite="None",
            max_age = 1 * 60 * 60  # 3 600 seconds = 1 hour

        )
        return resp

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(500, "Internal server error")


@router.post("/login")
async def login(payload: LoginRequest, req: Request):
    db = req.app.state.db
    try:
        result = await login_user(payload.email, payload.password, db)
        token = result["access_token"]

        resp = JSONResponse(content=result)
        resp.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=True,
            samesite="None",
            max_age= 2 * 24 * 60 * 60,  # 30 days
        )
        return resp

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(500, "Internal server error")


@router.post("/logout")
async def logout(response: Response):
    """
    Clear the HTTP-only access_token cookie to terminate the session.
    """
    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        secure=True,
        samesite="None",
    )
    return {"message": "Logged out successfully"}


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, request: Request):
    db = request.app.state.db
    user = await db["users"].find_one({"email": payload.email})
    if not user:
        # Don’t reveal whether the user exists
        return {"message": "If that email exists, a reset link has been sent."}

    token = generate_reset_token(payload.email)
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

    try:
        send_reset_email(payload.email, reset_link)    # ← no await
    except RuntimeError:
        logging.exception("Password-reset email failed")

    return {"message": f"Password reset link has been sent to {payload.email}"}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, request: Request):
    db = request.app.state.db
    try:
        email = verify_reset_token(payload.token)
    except Exception as e:
        raise HTTPException(400, str(e))
    user = await db["users"].find_one({"email": email})
    if not user:
        raise HTTPException(404, "User not found")
    hashed = get_password_hash(payload.new_password)
    await db["users"].update_one({"email": email}, {"$set": {"hashed_password": hashed}})
    return {"message": "Password reset successful"}

class SendCodeRequest(BaseModel):
    email: EmailStr

@router.post("/send-code")
async def send_code(payload: SendCodeRequest, request: Request):
    db = request.app.state.db

    # don't allow if account already exists
    if await db["users"].find_one({"email": payload.email}):
        raise HTTPException(400, "Email already registered")

    code = f"{randint(0, 999_999):06d}"
    hashed = _pwd_ctx.hash(code)
    expires = datetime.utcnow() + timedelta(minutes=10)

    await db["email_verifications"].update_one(
        {"email": payload.email},
        {"$set": {"code_hash": hashed, "expires": expires}},
        upsert=True,
    )

    send_verification_email(payload.email, code)
    # ------------------------------------------------------------------
     # Off-load the blocking network call and handle any delivery error
     # gracefully so the API never crashes with 500.
     # ------------------------------------------------------------------
    try:
        await run_in_threadpool(send_verification_email, payload.email, code)
    except RuntimeError as exc:
        # Roll back – user never received the code, so don’t leave a
        # useless (or abusable) record dangling in the DB.
        await db["email_verifications"].delete_one({"email": payload.email})
        logging.exception("Verification e-mail could not be delivered")
        raise HTTPException(
            status_code=503,
            detail="E-mail delivery failed.  Please try again later.",
        ) from exc
 
    return {"message": "Code sent"}

# ─── POST /auth/verify-code ───────────────────────────────────────
class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str

@router.post("/verify-code")
async def verify_code(payload: VerifyCodeRequest, request: Request):
    rec = await request.app.state.db["email_verifications"].find_one(
        {"email": payload.email}
    )
    if not rec or rec["expires"] < datetime.utcnow():
        raise HTTPException(400, "Code expired")

    if not _pwd_ctx.verify(payload.code, rec["code_hash"]):
        raise HTTPException(400, "Invalid code")

    # delete so the code can’t be reused
    await request.app.state.db["email_verifications"].delete_one(
        {"email": payload.email}
    )
    return {"verified": True}