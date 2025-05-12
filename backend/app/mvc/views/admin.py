# backend/app/mvc/views/admin.py

from fastapi import APIRouter, Depends, HTTPException, Request
from backend.app.utils.security import require_admin
from backend.app.mvc.models.user import UserInDB
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import Body 
from pydantic import BaseModel
from backend.app.mvc.controllers.documents import delete_document
import logging

class RoleUpdate(BaseModel):
    new_role: str
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
 
    # 1) delete the auth record first
    auth_del = await db.users.delete_one({"email": email})
    if auth_del.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
 
    # 2) purge normal “by-user” collections ---------------------------
    for coll in [
        "risk_assessments",
        "compliance_reports",
        "translation_reports",
        "rephrase_reports",
        "chatbot_sessions",
    ]:
        await db[coll].delete_many({"user_id": email})
 
    # 3) delete **documents** properly  -------------------------------
    #    – iterate so we can remove the associated GridFS files, too
    docs_cursor = db.documents.find({"owner_id": email})
    async for doc in docs_cursor:
        try:
            await delete_document(db, str(doc["_id"]))
        except Exception as exc:            # keep going even if one fails
            logging.warning(
                "Could not delete document %s for %s: %s",
                doc.get("_id"), email, exc, exc_info=True
            )
 
    return {"detail": f"User {email} and ALL their data have been deleted"}

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
@router.put("/users/{email}/role")
async def change_role(
    email: str,
    request: Request,
    _admin: UserInDB = Depends(require_admin),
    payload: RoleUpdate = Body(...),
):
    new_role = payload.new_role.lower()

    if new_role not in {"admin", "user"}:
        raise HTTPException(400, detail="Role must be 'admin' or 'user'")

    db: AsyncIOMotorDatabase = request.app.state.db
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"role": new_role}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, detail="User not found")

    return {"detail": f"{email} is now a(n) {new_role}"}