# backend/app/mvc/controllers/auth.py

from backend.app.mvc.models.user import User, UserInDB
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException

from backend.app.utils.jwt_utils import create_access_token
from backend.app.utils.security import pwd_context  # ← SINGLE bcrypt context


async def register_user(user: User, db: AsyncIOMotorDatabase) -> UserInDB:
    users = db["users"]

    # Ensure e-mail is unique
    if await users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Normalize casing
    first = user.first_name.strip().capitalize()
    last = user.last_name.strip().capitalize()

    # Hash password using global context
    hashed_pwd = pwd_context.hash(user.hashed_password)

    doc = user.dict()
    doc.update(
        {
            "first_name": first,
            "last_name": last,
            "hashed_password": hashed_pwd,
        }
    )

    res = await users.insert_one(doc)
    stored = await users.find_one({"_id": res.inserted_id})
    return UserInDB.from_mongo(stored)


async def login_user(email: str, password: str, db: AsyncIOMotorDatabase) -> dict:
    users = db["users"]

    user_doc = await users.find_one({"email": email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = UserInDB.from_mongo(user_doc)

    # Validate password (global bcrypt context)
    if not pwd_context.verify(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}
