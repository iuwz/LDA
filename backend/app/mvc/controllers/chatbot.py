"""
Central chatbot-persistence logic (LEGAL-ONLY edition – robust GPT classifier)
────────────────────────────────────────────────────────────────────────────
Fix: The previous lightweight classifier never detected legal questions
because the helper `call_gpt` didn't support the separate *system* prompt
parameter.  We now construct a **single prompt string** that embeds the
instruction *and* the user's question, then parse the first occurrence of
"LEGAL" or "NONLEGAL" in the model's response.

Collection layout unchanged – see earlier header for details.
"""
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
_CLASSIFIER_MODEL = "gpt-3.5-turbo-0125"  # cheap & fast

# Bare‑bones instruction; we’ll embed the user question below.
_CLASSIFIER_PROMPT_TEMPLATE = (
    "You are a short classification assistant. "
    "Given a user question, decide if it seeks *legal or similar near legal field* information or advice "
    "Return exactly either LEGAL or NONLEGAL—no extra words, no punctuation.\n\n"
    "User question: {question}\nAnswer:"
)

_CLASSIFIER_REGEX = re.compile(r"\b(LEGAL|NONLEGAL)\b", re.I)


async def _is_legal_query(user_id: str, question: str) -> bool:
    """Return True if GPT labels the *question* as legal‑related."""
    prompt = _CLASSIFIER_PROMPT_TEMPLATE.format(question=question.strip())
    try:
        raw_resp: str = call_gpt(
            prompt,
            model=_CLASSIFIER_MODEL,
            temperature=0,
            max_tokens=4,
        ) or ""
        logger.debug("Classifier raw response for %s: %s", user_id, raw_resp)
        match = _CLASSIFIER_REGEX.search(raw_resp)
        return match and match.group(1).upper() == "LEGAL"
    except Exception as exc:  # noqa: BLE001
        logger.exception("Classifier failed – default NONLEGAL: %s", exc)
        return False


# ───────────────────────────────── helpers

def _ts() -> datetime:
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
    """Persist *query*, classify, maybe answer, persist reply, return result."""

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

    # 2. is it legal?
    is_legal = await _is_legal_query(user_id, query)

    if is_legal:
        assistant_reply = (
            call_gpt(query) or "Sorry, I'm unable to respond right now – please try again later."
        )
    else:
        assistant_reply = (
            "Sorry, I can only assist with legal questions. "
            "Please rephrase your request to focus on legal matters."
        )

    # 3. persist messages
    now = _ts()
    msgs = []
    if not new_session:
        msgs.append({"sender": "user", "text": query, "timestamp": now})
    msgs.append({"sender": "bot", "text": assistant_reply, "timestamp": now})

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

    def _iso(ts):
        return ts.isoformat() if isinstance(ts, datetime) else str(ts)

    return [{"sender": m["sender"], "text": m["text"], "timestamp": _iso(m["timestamp"])} for m in doc["messages"]]


# NEW helper ────────────────────────────────────────────────
async def delete_session(
    db: AsyncIOMotorDatabase, *, user_id: str, session_id: str
) -> None:
    if not ObjectId.is_valid(session_id):
        raise ValueError("Invalid session id")

    res = await db[COLL].delete_one({"_id": ObjectId(session_id), "user_id": user_id})
    if res.deleted_count == 0:
        raise ValueError("Session not found")
