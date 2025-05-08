# backend/app/mvc/views/auth.py
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.mvc.models.user import User
from app.mvc.controllers.auth import register_user, login_user

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
            secure=False,                      # set True when using HTTPS
            samesite="lax",
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
