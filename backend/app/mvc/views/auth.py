# backend/app/mvc/views/auth.py
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from backend.app.utils.email_utils import send_reset_email
from backend.app.utils.security import generate_reset_token, verify_reset_token, get_password_hash
from pydantic import EmailStr

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
        saved = await register_user(user, db)
        return {
            "message": "User registered successfully",
            "user": saved.dict(),
        }
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
            secure=True,                      # set True when using HTTPS
            samesite="None",
            max_age=30 * 24 * 60 * 60,         # 30 days in seconds
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
        secure=False,
        samesite="lax",
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
    frontend_url = "http://localhost:5173"  # Or your deployed frontend
    reset_link = f"{frontend_url}/reset-password?token={token}"
    send_reset_email(payload.email, reset_link)
    return {"message": "If that email exists, a reset link has been sent."}

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
