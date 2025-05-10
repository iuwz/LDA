# backend/app/utils/jwt_utils.py
import os
from datetime import datetime, timedelta

import jwt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_supersecretkey")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_LIFESPAN = timedelta(days=int(os.getenv("ACCESS_TOKEN_LIFESPAN", 30)))  # Default: 30 days


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Generate a JWT access token.

    If *expires_delta* is omitted, the token lives for ACCESS_TOKEN_LIFESPAN.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or ACCESS_TOKEN_LIFESPAN)
    to_encode.update({"exp": expire})
    
    try:
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    except Exception as e:
        print(f"Error creating token: {e}")
        return ""


def decode_access_token(token: str) -> dict | None:
    """
    Decode *token* and return its payload dictionary, or None if invalid / expired.
    """
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        print("Token expired.")
        return None
    except jwt.InvalidTokenError:
        print("Invalid token.")
        return None
