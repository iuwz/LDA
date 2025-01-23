from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Request body schema
class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
async def login(request: LoginRequest):
    # Placeholder logic for login
    if request.username == "admin" and request.password == "password":
        return {"message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid credentials")
