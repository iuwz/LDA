from app.mvc.models.user import User, UserInDB
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException
from passlib.context import CryptContext
from app.utils.jwt_utils import create_access_token

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def register_user(user: User, db: AsyncIOMotorDatabase):
    """Service to register a new user."""
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


async def login_user(email: str, password: str, db: AsyncIOMotorDatabase):
    """Service to validate user credentials and return a JWT token."""
    users_collection = db["users"]

    # Find the user by email
    user_data = await users_collection.find_one({"email": email})
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Verify the password
    user = UserInDB.from_mongo(user_data)
    if not pwd_context.verify(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Generate JWT token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
