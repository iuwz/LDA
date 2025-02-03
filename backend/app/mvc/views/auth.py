from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.mvc.models.user import User
from app.mvc.controllers.auth import register_user, login_user

router = APIRouter()

# Login request schema
class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
async def register(user: User, request: Request):
    """Endpoint to register a new user."""
    db = request.app.state.db  # Access the database from the app state
    try:
        saved_user = await register_user(user, db)
        return {"message": "User registered successfully", "user": saved_user.dict()}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/login")
async def login(request: LoginRequest, req: Request):
    """Endpoint to authenticate a user and return a JWT token."""
    db = req.app.state.db  # Access the database from the app state
    try:
        result = await login_user(request.email, request.password, db)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
