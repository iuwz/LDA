from fastapi import APIRouter, Request, HTTPException
from app.models.user import User
from app.services.auth_service import register_user

router = APIRouter()

@router.post("/register")
async def register(user: User, request: Request):
    db = request.app.state.db  # Access the database from the app state
    try:
        saved_user = await register_user(user, db)
        return {"message": "User registered successfully", "user": saved_user.dict()}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
