from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    username: str
    email: EmailStr
    hashed_password: str

    class Config:
        json_schema_extra = {  # Updated for Pydantic v2+
            "example": {
                "username": "johndoe",
                "email": "johndoe@example.com",
                "hashed_password": "hashed_password_string",
            }
        }


class UserInDB(User):
    id: Optional[str]

    @classmethod
    def from_mongo(cls, data):
        if "_id" in data:
            data["id"] = str(data["_id"])
            del data["_id"]
        return cls(**data)
