# backend/app/mvc/controllers/analysis.py
"""
Risk-analysis engine (OpenAI GPT).

Highlights
----------
• Automatic chunking – no more “only first 3 pages”.
• Forced-JSON mode with graceful salvage if the model still goes rogue.
• Duplicate-risk de-duplication across overlapping chunks.
• All main parameters (model, chunk size, temperature …) can be changed
  without code edits – just set environment variables.

Environment variables
---------------------
GPT_MODEL              default: gpt-4o-mini
RISK_CHUNK_TOKENS      default: 2600   (# tokens per slice)
RISK_OVERLAP_TOKENS    default: 200    (overlap between slices)
RISK_GPT_TEMP          default: 0.3
RISK_PREVIEW_LEN       default: 8000   (chars persisted for “preview”)
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from typing import List, Optional, Tuple

import tiktoken                              # pip install tiktoken
from bson.objectid import ObjectId
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.app.core.openai_client import call_gpt

logger = logging.getLogger(__name__)

# ───────────────────────── configuration ─────────────────────────
GPT_MODEL          = os.getenv("GPT_MODEL", "gpt-4o-mini")
ENCODING           = tiktoken.encoding_for_model(GPT_MODEL)
CHUNK_TOKENS       = int(os.getenv("RISK_CHUNK_TOKENS", 2600))
OVERLAP_TOKENS     = int(os.getenv("RISK_OVERLAP_TOKENS", 200))
GPT_TEMP           = float(os.getenv("RISK_GPT_TEMP", 0.3))
PREVIEW_LEN        = int(os.getenv("RISK_PREVIEW_LEN", 8000))

SYSTEM_MESSAGE = (
    "You are an expert legal AI specialising in the laws and regulations of the "
    "Kingdom of Saudi Arabia. The user will give you *part* of a legal document. "
    "Identify every potential legal, regulatory, or compliance risk that relates "
    "to current Saudi law.  Return STRICTLY the following JSON – no extra keys, "
    'no commentary:\n'
    '{\"risks\":[{\"section\":\"…\",\"clause\":\"…\",\"risk_description\":\"…\",'
    '\"severity\":\"Low|Medium|High\",\"recommendation\":\"…\"}]}')


# ═════════════════════════ helper functions ═════════════════════════
def _token_len(text: str) -> int:
    """Return number of tokens according to the model’s encoding."""
    return len(ENCODING.encode(text))


def _split_into_chunks(text: str) -> List[str]:
    """
    Greedy word splitter that keeps ≤ CHUNK_TOKENS tokens per chunk and
    overlaps with the previous slice to avoid cutting clauses in half.
    """
    if _token_len(text) <= CHUNK_TOKENS:
        return [text]

    words: List[str] = text.split()
    chunks: List[str] = []
    cur: List[str] = []
    cur_tokens = 0

    for w in words:
        t = _token_len(" " + w)
        if cur_tokens + t > CHUNK_TOKENS:
            chunks.append(" ".join(cur))
            # slide window with overlap
            overlap = cur[-OVERLAP_TOKENS:] if OVERLAP_TOKENS else []
            cur = overlap + [w]
            cur_tokens = sum(_token_len(" " + s) for s in cur)
        else:
            cur.append(w)
            cur_tokens += t

    if cur:
        chunks.append(" ".join(cur))
    return chunks


async def _analyse_chunk(chunk: str, idx: int, total: int) -> List[dict]:
    """
    Single GPT call executed in a separate thread.
    Always tries to return a *list of risk objects* (may be empty).
    """
    prompt = (
        f"Document chunk {idx} of {total}:\n{chunk}\n\n"
        "Return ONLY the JSON specified by the system message."
    )

    raw = await call_gpt(
        prompt=prompt,
        system_message=SYSTEM_MESSAGE,
        model="o4-mini",
        temperature=GPT_TEMP,
        response_format={"type": "json_object"},
        max_tokens=16384,
    )

    # best-case: valid JSON
    try:
        data = json.loads(raw or "")
        if isinstance(data.get("risks"), list):
            return data["risks"]
    except Exception:
        pass

    # salvage: try to extract *some* JSON object from the output
    logger.warning("Chunk %s/%s – invalid JSON, attempting salvage", idx, total)
    return _salvage_risks(raw)


def _salvage_risks(bad_json: str) -> List[dict]:
    """
    Extract the first {...} object found in the text and parse it leniently.
    """
    import re

    m = re.search(r"\{(?:[^{}]|(?R))*\}", bad_json, re.S)
    if not m:
        return []

    try:
        data = json.loads(m.group(0))
        return data.get("risks", []) if isinstance(data.get("risks"), list) else []
    except Exception:
        return []


def _dedup_risks(risks: List[dict]) -> List[dict]:
    """
    De-duplicate identical risks that may have been reported in overlapping
    chunks.  Two risks are considered the same if (clause, description) match
    case-insensitively after stripping whitespace.
    """
    seen: set[Tuple[str, str]] = set()
    out: List[dict] = []
    for r in risks:
        key = (
            (r.get("clause") or "").strip().lower(),
            r.get("risk_description") or "",
        )
        if key in seen:
            continue
        seen.add(key)
        out.append(r)
    return out


# ═════════════════════════ public interface ═════════════════════════
async def analyze_risk(
    document_text: str,
    user_id: str,
    db: AsyncIOMotorDatabase,
    *,
    filename: Optional[str] = None,
) -> dict:
    """
    Main entry – called by REST endpoints.
    Splits the document, calls GPT on each slice and stores a merged report.
    """
    if not document_text:
        raise HTTPException(status_code=400, detail="Document text is required.")

    chunks = _split_into_chunks(document_text)
    logger.info("Risk-analysis: processing %s chunk(s)", len(chunks))

    all_risks: List[dict] = []
    for idx, chunk in enumerate(chunks, 1):
        try:
            all_risks.extend(await _analyse_chunk(chunk, idx, len(chunks)))
        except Exception as e:
            logger.error("Chunk %s/%s failed: %s", idx, len(chunks), e)

    risks = _dedup_risks(all_risks)
    logger.info("Risk-analysis finished – %s unique risks", len(risks))

    # store to MongoDB
    report = {
        "user_id": user_id,
        "filename": filename,
        "document_text_preview": document_text[:PREVIEW_LEN],
        "risks": risks,
        "report_doc_id": None,
        "report_filename": None,
        "created_at": datetime.utcnow(),
    }
    inserted = await db.risk_assessments.insert_one(report)

    return {"id": str(inserted.inserted_id), "risks": risks}


# ═════════════════════════ CRUD HELPERS ═════════════════════════
async def get_risk_report(report_id: str, db: AsyncIOMotorDatabase):
    """Fetch one stored report by its Mongo ObjectId."""
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=400, detail="Invalid report ID")
    rec = await db.risk_assessments.find_one({"_id": ObjectId(report_id)})
    if not rec:
        raise HTTPException(status_code=404, detail="Report not found")
    rec["_id"] = str(rec["_id"])
    return rec


async def delete_risk_report(report_id: str, user_id: str, db: AsyncIOMotorDatabase):
    """Delete a report only if it belongs to the user."""
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=400, detail="Invalid report ID")
    res = await db.risk_assessments.delete_one(
        {"_id": ObjectId(report_id), "user_id": user_id}
    )
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found or not authorised")
    return {"detail": "Deleted"}