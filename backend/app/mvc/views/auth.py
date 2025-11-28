# backend/app/mvc/views/auth.py

import os
import re
import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request, Response, Query
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr

from backend.app.mvc.models.user import User
from backend.app.mvc.controllers.auth import register_user, login_user
from backend.app.utils.email_utils import (
    send_reset_email,
    send_verification_email,
    random_code,
)
from backend.app.utils.security import (
    generate_reset_token,
    verify_reset_token,
    get_password_hash,
    pwd_context,  # ← GLOBAL bcrypt context
)

router = APIRouter()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


# ─────────────────────────── Schemas ────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class SendCodeRequest(BaseModel):
    email: EmailStr


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


# ─────────────────────────── Routes ─────────────────────────────

@router.post("/register")
async def register(user: User, request: Request):
    db = request.app.state.db
    try:
        saved = await register_user(user, db)
        auth_result = await login_user(user.email, user.hashed_password, db)
        token = auth_result["access_token"]

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
            max_age=3600,
        )
        return resp

    except HTTPException:
        raise
    except Exception:
        logging.exception("Unexpected error during /register")
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
            max_age=2 * 24 * 60 * 60,
        )
        return resp

    except HTTPException:
        raise
    except Exception:
        logging.exception("Unexpected error during /login")
        raise HTTPException(500, "Internal server error")


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        secure=True,
        samesite="None",
    )
    return {"message": "Logged out successfully"}


# ─────────────── Password-reset ───────────────────────────

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, request: Request):
    db = request.app.state.db
    user = await db["users"].find_one({"email": payload.email})

    if not user:
        return {"message": "If that email exists, a reset link has been sent."}

    token = generate_reset_token(payload.email)
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

    try:
        await run_in_threadpool(send_reset_email, payload.email, reset_link)
    except RuntimeError:
        logging.exception("Password-reset email failed")

    return {"message": "Password reset link has been sent"}


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
    await db["users"].update_one(
        {"email": email}, {"$set": {"hashed_password": hashed}}
    )
    return {"message": "Password reset successful"}


# ─────────────── Email verification ───────────────────────

@router.post("/send-code")
async def send_code(payload: SendCodeRequest, request: Request):
    db = request.app.state.db

    if await db["users"].find_one({"email": payload.email}):
        raise HTTPException(400, "Email already registered")

    code = random_code()
    hashed = pwd_context.hash(code)  # ← FIXED
    expires = datetime.utcnow() + timedelta(minutes=10)

    await db["email_verifications"].update_one(
        {"email": payload.email},
        {"$set": {"code_hash": hashed, "expires": expires}},
        upsert=True,
    )

    try:
        await run_in_threadpool(send_verification_email, payload.email, code)
    except RuntimeError as exc:
        await db["email_verifications"].delete_one({"email": payload.email})
        msg = str(exc)
        if re.search(r"unique recipients limit", msg, re.I):
            raise HTTPException(429, "E-mail quota reached")
        raise HTTPException(503, "E-mail service unavailable")

    return {"message": "Code sent"}


@router.post("/verify-code")
async def verify_code(payload: VerifyCodeRequest, request: Request):
    rec = await request.app.state.db["email_verifications"].find_one(
        {"email": payload.email}
    )
    if not rec or rec["expires"] < datetime.utcnow():
        raise HTTPException(400, "Code expired")

    if not pwd_context.verify(payload.code, rec["code_hash"]):  # ← FIXED
        raise HTTPException(400, "Invalid code")

    await request.app.state.db["email_verifications"].delete_one(
        {"email": payload.email}
    )

    return {"verified": True}


# ─────────────── Quick check ───────────────

@router.get("/check-email")
async def check_email(request: Request, email: EmailStr = Query(...)):
    db = request.app.state.db
    exists = bool(await db["users"].find_one({"email": email}))
    return {"exists": exists}

