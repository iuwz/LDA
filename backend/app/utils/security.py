# backend/app/utils/security.py

from fastapi import Request, HTTPException, status, Depends
from passlib.context import CryptContext
from app.mvc.models.user import UserInDB

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def get_current_user(request: Request) -> UserInDB:
    """
    Dependency to retrieve the logged-in user based on JWT in header or cookie.
    The JWT must encode the user's email under request.state.user_id.
    """
    email = getattr(request.state, "user_id", None)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    user_data = await request.app.state.db["users"].find_one({"email": email})
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return UserInDB.from_mongo(user_data)

async def require_admin(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    """
    Dependency to ensure the current_user has the 'admin' role.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check that an unhashed password matches the stored hash.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a plain-text password for storage.
    """
    return pwd_context.hash(password)