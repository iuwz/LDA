# backend/app/mvc/views/auth.py

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

router = APIRouter()


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
        # Don't reveal if user exists
        return {"message": "If that email exists, a reset link has been sent."}
    token = generate_reset_token(payload.email)
    frontend_url = "https://lda-1-dcto.onrender.com"  # Or your deployed frontend URL
    reset_link = f"{frontend_url}/reset-password?token={token}"
    try:
        await send_reset_email(payload.email, reset_link)
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
