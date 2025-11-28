# backend/app/utils/security.py

import os
from dotenv import load_dotenv
from fastapi import Request, HTTPException, status, Depends
from passlib.context import CryptContext
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from backend.app.mvc.models.user import UserInDB

# Load environment variables
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")
RESET_TOKEN_EXPIRES = 3600  # 1 hour

# -------------------------------------------------------------------
# GLOBAL bcrypt context (ONLY ONE in the entire backend)
# -------------------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def get_current_user(request: Request) -> UserInDB:
    """
    Dependency to retrieve the logged-in user based on JWT in header or cookie.
    """
    email = getattr(request.state, "user_id", None)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    user_data = await request.app.state.db["users"].find_one({"email": email})
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return UserInDB.from_mongo(user_data)


async def require_admin(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


# -------------------------------------------------------------------
# Password helpers
# -------------------------------------------------------------------
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# -------------------------------------------------------------------
# Reset token utilities
# -------------------------------------------------------------------
def generate_reset_token(email: str) -> str:
    s = URLSafeTimedSerializer(SECRET_KEY)
    return s.dumps(email, salt="password-reset")


def verify_reset_token(token: str, max_age=RESET_TOKEN_EXPIRES) -> str:
    s = URLSafeTimedSerializer(SECRET_KEY)
    try:
        email = s.loads(token, salt="password-reset", max_age=max_age)
        return email
    except SignatureExpired:
        raise ValueError("Token expired")
    except BadSignature:
        raise ValueError("Invalid token")
