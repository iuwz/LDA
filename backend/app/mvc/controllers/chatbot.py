from __future__ import annotations

import re
import logging
from datetime import datetime
from typing import Optional, Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.app.core.openai_client import call_gpt

logger = logging.getLogger(__name__)
COLL = "chat_sessions"


# ───────────────────────────────── GPT-based legal-question classifier
_CLASSIFIER_MODEL = "gpt-3.5-turbo-0125"  # low cost & fast
_CLASSIFIER_PROMPT = """
You are a legal-question detector. Determine if the user’s question is about:
  • legal matters, anything related to legal compliance, new laws, regulations,  contracts, near-legal matters, anything similar or related to the legal field in any way
  • OR something else.

Respond with exactly one token (no extra text):
LEGAL    — if it’s legal or near-legal
NONLEGAL — otherwise

Examples:
Q: “How do I write an NDA between two startups?”
A: LEGAL

Q: “Explain GDPR data-processing agreement terms”
A: LEGAL

Q: “What’s the weather in Paris?”
A: NONLEGAL

Q: “How do I bake sourdough bread?”
A: NONLEGAL

Now classify this:
Q: "{question}"
A:"""


async def _is_legal_query(user_id: str, question: str) -> bool:
    """Ask the lightweight GPT model to tag LEGAL or NONLEGAL."""
    try:
        prompt = _CLASSIFIER_PROMPT.format(question=question.strip())
        raw = call_gpt(
            prompt=prompt,
            model=_CLASSIFIER_MODEL,
            temperature=0,
            max_tokens=1,
        ) or ""
        logger.debug("Classifier response for %s → %s", user_id, raw)
        return raw.strip().upper() == "LEGAL"
    except Exception:
        logger.exception("Classifier failed; defaulting to NONLEGAL")
        return False


# ───────────────────────────────── helpers

def _ts() -> datetime:
    """Central UTC timestamp helper."""
    return datetime.utcnow()


async def _ensure_session(
    db: AsyncIOMotorDatabase, user_id: str, first_user_msg: str | None = None
) -> ObjectId:
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
    """Persist query, classify, maybe answer, persist reply, and return result."""
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

    # 2. classify via GPT-only
    legal = await _is_legal_query(user_id, query)

    if legal:
        assistant_reply = (
            call_gpt(query) or
            "Sorry, I'm unable to respond right now – please try again later."
        )
    else:
        assistant_reply = (
            "Sorry, I can only assist with legal questions. "
            "Please rephrase your request to focus on legal or compliance matters."
        )

    # 3. persist messages
    now = _ts()
    msgs: list[dict[str, Any]] = []
    if not new_session:
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
        out.append({
            "id": str(doc["_id"]),
            "title": doc["title"],
            "preview": preview,
            "created_at": doc["created_at"].isoformat(),
            "updated_at": doc["updated_at"].isoformat(),
        })
    return out


async def get_messages(
    db: AsyncIOMotorDatabase, user_id: str, session_id: str
) -> list[dict]:
    if not ObjectId.is_valid(session_id):
        raise ValueError("Invalid session id")
    doc = await db[COLL].find_one({"_id": ObjectId(session_id), "user_id": user_id}, {"messages": 1})
    if not doc:
        raise ValueError("Session not found")
    def _iso(ts: Any) -> str:
        return ts.isoformat() if isinstance(ts, datetime) else str(ts)
    return [
        {"sender": m["sender"], "text": m["text"], "timestamp": _iso(m["timestamp"])}
        for m in doc["messages"]
    ]


async def delete_session(
    db: AsyncIOMotorDatabase, *, user_id: str, session_id: str
) -> None:
    if not ObjectId.is_valid(session_id):
        raise ValueError("Invalid session id")
    res = await db[COLL].delete_one({"_id": ObjectId(session_id), "user_id": user_id})
    if res.deleted_count == 0:
        raise ValueError("Session not found")
