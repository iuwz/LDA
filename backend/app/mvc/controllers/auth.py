# backend/app/mvc/controllers/auth.py
from app.mvc.models.user import User, UserInDB
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException
from passlib.context import CryptContext
from app.utils.jwt_utils import create_access_token

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def register_user(user: User, db: AsyncIOMotorDatabase) -> UserInDB:
    """Register a new user and return the stored record."""
    users = db["users"]

    # Ensure e-mail is unique
    if await users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash and store
    hashed_pwd = pwd_context.hash(user.hashed_password)
    doc = user.dict()
    doc["hashed_password"] = hashed_pwd
    res = await users.insert_one(doc)

    stored = await users.find_one({"_id": res.inserted_id})
    return UserInDB.from_mongo(stored)


async def login_user(
    email: str,
    password: str,
    db: AsyncIOMotorDatabase,
) -> dict:
    """Validate credentials and return a JWT access-token payload."""
    users = db["users"]

    user_doc = await users.find_one({"email": email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = UserInDB.from_mongo(user_doc)
    if not pwd_context.verify(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}
