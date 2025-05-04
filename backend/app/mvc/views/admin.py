# backend/app/mvc/views/admin.py

from fastapi import APIRouter, Depends, HTTPException, Request
from app.utils.security import require_admin
from app.mvc.models.user import UserInDB
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter( tags=["Admin"])

@router.get("/users")
async def list_users(
    request: Request,
    admin: UserInDB = Depends(require_admin),
):
    """
    List all users (email & role only). Role defaults to 'user' if missing.
    """
    db: AsyncIOMotorDatabase = request.app.state.db
    # Project only email and role
    cursor = db.users.find({}, {"email": 1, "role": 1})
    users = await cursor.to_list(None)
    # Safely extract fields with defaults
    return [
        {
            "email": u.get("email"),
            "role": u.get("role", "user"),
        }
        for u in users
    ]

@router.put("/users/{email}/role")
async def change_role(
    email: str,
    new_role: str,
    request: Request,
    admin: UserInDB = Depends(require_admin),
):
    db: AsyncIOMotorDatabase = request.app.state.db
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"role": new_role}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": f"{email} is now a {new_role}"}

@router.delete("/users/{email}")
async def delete_user(
    email: str,
    request: Request,
    admin: UserInDB = Depends(require_admin),
):
    db: AsyncIOMotorDatabase = request.app.state.db
    # Delete auth record
    auth_del = await db.users.delete_one({"email": email})
    if auth_del.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    # Purge user-related data
    colls = [
        "risk_assessments", "compliance_reports", "translation_reports",
        "rephrase_reports", "chatbot_sessions", "documents"
    ]
    for coll in colls:
        await db[coll].delete_many({"user_id": email})
    return {"detail": f"User {email} and all their data have been deleted"}

@router.get("/metrics/users")
async def user_metrics(
    request: Request,
    admin: UserInDB = Depends(require_admin),
):
    db: AsyncIOMotorDatabase = request.app.state.db
    counts = {}
    for coll in [
        "users", "risk_assessments", "compliance_reports",
        "translation_reports", "rephrase_reports", "chatbot_sessions", "documents"
    ]:
        counts[coll] = await db[coll].count_documents({})
    return counts
