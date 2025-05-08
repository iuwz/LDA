"""
Central chatbot-persistence logic
─────────────────────────────────
Collection layout
-----------------
chat_sessions
  _id            ObjectId
  user_id        str  (current_user.id → the Users collection ObjectId str)
  title          str
  created_at     datetime
  updated_at     datetime
  messages       [
                   { "sender": "user" | "bot",
                     "text": str,
                     "timestamp": datetime }
                 ]
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional, Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.openai_client import call_gpt

logger = logging.getLogger(__name__)
COLL = "chat_sessions"


# ───────────────────────────────── helpers
def _ts() -> datetime:  # single, central UTC timestamp helper
    return datetime.utcnow()


async def _ensure_session(
    db: AsyncIOMotorDatabase, user_id: str, first_user_msg: str | None = None
) -> ObjectId:
    """
    Create a new session and (optionally) insert the very first user message.
    Returns the new ObjectId.
    """
    now = _ts()
    doc: dict[str, Any] = {
        "user_id": user_id,
        "title": (first_user_msg[:50] + "...") if first_user_msg else "New Conversation",
        "created_at": now,
        "updated_at": now,
        "messages": [],
    }
    if first_user_msg:
        doc["messages"].append({"sender": "user", "text": first_user_msg, "timestamp": now})

    res = await db[COLL].insert_one(doc)
    return res.inserted_id


# ───────────────────────────────── public API
async def chat(
    db: AsyncIOMotorDatabase,
    *,
    user_id: str,
    query: str,
    session_id: Optional[str] = None,
) -> dict[str, str]:
    """
    Persist the query, ask GPT, persist the reply, return both IDs and reply.
    """
    # 1. fetch or create session
    new_session = False
    if session_id and ObjectId.is_valid(session_id):
        sid = ObjectId(session_id)
        session = await db[COLL].find_one({"_id": sid, "user_id": user_id}, {"_id": 1})
        if not session:
            raise ValueError("Session not found")
    else:
        sid = await _ensure_session(db, user_id, query)
        new_session = True

    # 2. ask GPT **after** session exists (so history appears immediately)
    assistant_reply = (
        call_gpt(query) or "Sorry, I’m unable to respond right now – please try again."
    )

    # 3. build message batch
    now = _ts()
    msgs = []
    if not new_session:  # first user message already written when session was created
        msgs.append({"sender": "user", "text": query, "timestamp": now})
    msgs.append({"sender": "bot", "text": assistant_reply, "timestamp": now})

    await db[COLL].update_one(
        {"_id": sid},
        {
            "$push": {"messages": {"$each": msgs}},
            "$set": {"updated_at": now, "title": query[:50] + ("..." if len(query) > 50 else "")},
        },
    )

    return {"session_id": str(sid), "bot_response": assistant_reply}


async def list_sessions(db: AsyncIOMotorDatabase, user_id: str) -> list[dict]:
    """
    Sidebar list – lightweight projection.
    """
    cursor = (
        db[COLL]
        .find({"user_id": user_id}, {"title": 1, "messages": 1, "updated_at": 1, "created_at": 1})
        .sort("updated_at", -1)
    )
    out: list[dict] = []
    async for doc in cursor:
        preview = ""
        if doc.get("messages"):
            preview = doc["messages"][-1]["text"][:60] + "..."
        out.append(
            {
                "id": str(doc["_id"]),
                "title": doc["title"],
                "preview": preview,
                "created_at": doc["created_at"].isoformat(),
                "updated_at": doc["updated_at"].isoformat(),
            }
        )
    return out


async def get_messages(
    db: AsyncIOMotorDatabase, user_id: str, session_id: str
) -> list[dict]:
    if not ObjectId.is_valid(session_id):
        raise ValueError("Invalid session id")

    doc = await db[COLL].find_one(
        {"_id": ObjectId(session_id), "user_id": user_id}, {"messages": 1}
    )
    if not doc:
        raise ValueError("Session not found")

    # stringify timestamps so React doesn’t choke on BSON datetimes
    return [
        {
            "sender": m["sender"],
            "text": m["text"],
            "timestamp": (
                m["timestamp"].isoformat() if isinstance(m["timestamp"], datetime) else str(m["timestamp"])
            ),
        }
        for m in doc["messages"]
    ]
