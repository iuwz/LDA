from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    username: str
    email: EmailStr
    hashed_password: str
    role: str = "user"  # Default role for new registrations

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
        # Preserve stored role (e.g. "admin")
        return cls(**data)
