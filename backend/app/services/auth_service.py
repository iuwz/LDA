from app.models.user import User, UserInDB
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def register_user(user: User, db: AsyncIOMotorDatabase):
    users_collection = db["users"]

    # Check if the user already exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password
    hashed_password = pwd_context.hash(user.hashed_password)

    # Save the user to the database
    new_user_data = user.dict()
    new_user_data["hashed_password"] = hashed_password
    result = await users_collection.insert_one(new_user_data)

    # Return the saved user
    saved_user = await users_collection.find_one({"_id": result.inserted_id})
    return UserInDB.from_mongo(saved_user)
