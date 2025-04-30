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
        saved_user = await register_user(user, db)
        return {"message": "User registered successfully", "user": saved_user.dict()}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/login")
async def login(request: LoginRequest, req: Request):
    db = req.app.state.db
    try:
        result = await login_user(request.email, request.password, db)
        access_token = result["access_token"]

        # wrap JSON + set a secure, HTTP-only cookie
        response = JSONResponse(content={
            "access_token": access_token,
            "token_type": "bearer"
        })
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,       # in production set True and serve over HTTPS
            samesite="lax",
            max_age=15 * 60     # 15 minutes, match your token expiry
        )
        return response

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/logout")
async def logout(response: Response):
    """
    Clears the HTTP-only access_token cookie so the session is destroyed.
    """
    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        secure=False,    # match your login cookie settings
        samesite="lax",
    )
    return {"message": "Logged out successfully"}
