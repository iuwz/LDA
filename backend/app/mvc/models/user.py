from pydantic import BaseModel, EmailStr, root_validator
from typing import Optional

class User(BaseModel):
    username: str
    email: EmailStr
    hashed_password: str
    role: str = "user"  # Default role is set to "user"

    # Enforce that the role remains "user" during registration, ignoring any client input.
    @root_validator(pre=True)
    def ensure_regular_user(cls, values):
        # Override or ignore the role if provided in input
        values["role"] = "user"
        return values

    class Config:
        json_schema_extra = {
            "example": {
                "username": "johndoe",
                "email": "johndoe@example.com",
                "hashed_password": "hashed_password_string",
                "role": "user"
            }
        }

class UserInDB(User):
    id: Optional[str]

    @classmethod
    def from_mongo(cls, data):
        if "_id" in data:
            data["id"] = str(data["_id"])
            del data["_id"]
        # When reading from the database, we expect the 'role' to be set based on your DB settings.
        # For instance, if you manually insert an admin, that data will be preserved.
        return cls(**data)
