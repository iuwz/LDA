# backend/app/utils/security.py

from fastapi import Request, HTTPException, status
from app.mvc.models.user import UserInDB

async def get_current_user(request: Request) -> UserInDB:
    """
    Dependency to retrieve the logged-in user based on JWT in header or cookie.
    """
    email = getattr(request.state, "user_id", None)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Not authenticated")

    user_data = await request.app.state.db["users"].find_one({"email": email})
    if not user_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="User not found")

    return UserInDB.from_mongo(user_data)
