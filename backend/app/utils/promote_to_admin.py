# backend/app/utils/promote_to_admin.py
import os
import sys
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME", "LDA")


async def promote_to_admin(email: str):
    """
    Promote a user to admin by setting their role to "admin".
    """
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    result = await db["users"].update_one(
        {"email": email},
        {"$set": {"role": "admin"}}
    )

    print(f"Modified {result.modified_count} document(s).")
    await client.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python promote_to_admin.py user@example.com")
        sys.exit(1)

    email = sys.argv[1]
    asyncio.run(promote_to_admin(email))
