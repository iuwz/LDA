"""
Central chatbot‑persistence logic (LEGAL‑ONLY edition – GPT classifier)
─────────────────────────────────────────────────────────────────────
This module stores chat history in MongoDB, mediates calls to OpenAI via
``backend.app.core.openai_client.call_gpt`` **and** enforces a guard‑rail:
1.  It first calls a *lightweight* OpenAI model to decide whether the user
    message is a *legal* question.  The classification prompt is engineered
    to return exactly either "LEGAL" or "NONLEGAL".
2.  If the query is legal → call the *main* model for a substantive answer.
3.  Otherwise the assistant refuses, explaining it can only help with legal
    matters.

Collection layout
─────────────────
chat_sessions
  _id            ObjectId
  user_id        str  (current_user.id → Users collection ObjectId str)
  title          str
  created_at     datetime (UTC)
  updated_at     datetime (UTC)
  messages       [
                   { "sender": "user" | "bot",
                     "text": str,
                     "timestamp": datetime }
                 ]
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Optional, Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.app.core.openai_client import call_gpt

logger = logging.getLogger(__name__)
COLL = "chat_sessions"


# ───────────────────────────────── GPT‑based legal‑question classifier
_CLASSIFIER_SYSTEM_PROMPT = (
    "You are a short classification assistant. "
    "Given a user question, decide if it is seeking *legal* information or "
    "advice (including compliance, regulations, contracts, disputes, etc.). "
    "Respond with exactly either the word LEGAL or NONLEGAL—no extra text."
)

# Use a lightweight/cheap chat model for classification.  Adjust as needed
_CLASSIFIER_MODEL = "gpt-3.5-turbo-0125"


async def _is_legal_query(db: AsyncIOMotorDatabase, user_id: str, question: str) -> bool:
    """Return True if the classifier judges *question* as legal‑related."""
    try:
        outcome: str = call_gpt(
            question,
            system_prompt=_CLASSIFIER_SYSTEM_PROMPT,
            model=_CLASSIFIER_MODEL,
            temperature=0,
            max_tokens=1,
        )
        outcome = (outcome or "").strip().upper()
        logger.debug("Classifier outcome for user %s: %s", user_id, outcome)
        return outcome == "LEGAL"
    except Exception as exc:  # noqa: BLE001
        logger.exception("Classifier failed – defaulting to NONLEGAL: %s", exc)
        return False


# ───────────────────────────────── helpers

def _ts() -> datetime:
    """Single, central UTC timestamp helper."""
    return datetime.utcnow()


async def _ensure_session(
    db: AsyncIOMotorDatabase, user_id: str, first_user_msg: str | None = None
) -> ObjectId:
    """Create a new session and (optionally) insert the very first user message."""
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
    """Persist *query*, run classifier & GPT, persist reply, return result."""

    # 1. fetch or create session – create early so conversation shows instantly
    new_session = False
    if session_id and ObjectId.is_valid(session_id):
        sid = ObjectId(session_id)
        session = await db[COLL].find_one({"_id": sid, "user_id": user_id}, {"_id": 1})
        if not session:
            raise ValueError("Session not found")
    else:
        sid = await _ensure_session(db, user_id, query)
        new_session = True

    # 2. Decide if the query is legal
    is_legal = await _is_legal_query(db, user_id, query)

    if is_legal:
        assistant_reply = (
            call_gpt(query)  # uses default (presumably stronger) model
            or "Sorry, I'm unable to respond right now – please try again later."
        )
    else:
        assistant_reply = (
            "Sorry, I can only assist with legal questions. "
            "Please rephrase your request to focus on legal matters."
        )

    # 3. build message batch
    now = _ts()
    msgs = []
    if not new_session:  # first user message already persisted when session created
        msgs.append({"sender": "user", "text": query, "timestamp": now})
    msgs.append({"sender": "bot", "text": assistant_reply, "timestamp": now})

    # 4. persist response
    await db[COLL].update_one(
        {"_id": sid},
        {
            "$push": {"messages": {"$each": msgs}},
            "$set": {
                "updated_at": now,
                "title": query[:50] + ("..." if len(query) > 50 else ""),
            },
        },
    )

    return {"session_id": str(sid), "bot_response": assistant_reply}


async def list_sessions(db: AsyncIOMotorDatabase, user_id: str) -> list[dict]:
    """Return a lightweight list of the user's chat sessions for the sidebar."""
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
    """Retrieve every message for *session_id* (timestamps → ISO)."""
    if not ObjectId.is_valid(session_id):
        raise ValueError("Invalid session id")

    doc = await db[COLL].find_one(
        {"_id": ObjectId(session_id), "user_id": user_id}, {"messages": 1}
    )
    if not doc:
        raise ValueError("Session not found")

    def _to_iso(ts: datetime | str) -> str:
        return ts.isoformat() if isinstance(ts, datetime) else str(ts)

    return [
        {"sender": m["sender"], "text": m["text"], "timestamp": _to_iso(m["timestamp"])}
        for m in doc["messages"]
    ]


# NEW helper ────────────────────────────────────────────────
async def delete_session(
    db: AsyncIOMotorDatabase, *, user_id: str, session_id: str
) -> None:
    """Delete a session and its messages."""
    if not ObjectId.is_valid(session_id):
        raise ValueError("Invalid session id")

    res = await db[COLL].delete_one({"_id": ObjectId(session_id), "user_id": user_id})
    if res.deleted_count == 0:
        raise ValueError("Session not found")
