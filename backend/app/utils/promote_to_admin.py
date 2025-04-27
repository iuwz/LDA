# backend/app/utils/promote_to_admin.py
import os
import sys
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()  # pulls in MONGODB_URI and DB_NAME from your .env

MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME   = os.getenv("DB_NAME")

async def promote_to_admin(email: str):
    client = AsyncIOMotorClient(MONGO_URI)
    db     = client[DB_NAME]
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"role": "admin"}}
    )
    print(f"Modified {result.modified_count} document(s).")
    client.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python promote_to_admin.py user@example.com")
        sys.exit(1)
    email = sys.argv[1]
    asyncio.run(promote_to_admin(email))
