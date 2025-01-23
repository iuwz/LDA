from pydantic import BaseModel, EmailStr
from typing import Optional
from bson import ObjectId

class User(BaseModel):
    username: str
    email: EmailStr
    hashed_password: str

    class Config:
        schema_extra = {
            "example": {
                "username": "johndoe",
                "email": "johndoe@example.com",
                "hashed_password": "hashed_password_string",
            }
        }


# Helper to convert MongoDB ObjectId to string
class UserInDB(User):
    id: Optional[str]

    @classmethod
    def from_mongo(cls, data):
        if "_id" in data:
            data["id"] = str(data["_id"])
            del data["_id"]
        return cls(**data)
