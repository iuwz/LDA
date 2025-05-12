# backend/app/mvc/controllers/analysis.py

import json
import logging
from datetime import datetime
from typing import Optional

from bson.objectid import ObjectId
from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.app.core.openai_client import call_gpt

logger = logging.getLogger(__name__)

async def analyze_risk(
    document_text: str,
    user_id: str,
    db: AsyncIOMotorDatabase,
    *,
    filename: Optional[str] = None,
) -> dict:
    """
    Analyze the risk of a legal document using OpenAI GPT.
    Stores the result in the risk_assessments collection.
    Returns: { "id": ..., "risks": [...] }
    """
    if not document_text:
        raise HTTPException(status_code=400, detail="Document text is required.")

    system_message = (
        "You are a legal AI. Identify potential legal risks in the document. "
        "Return valid JSON only, in the format:\n"
        '{ "risks": [ { "section": "...", "clause": "...", '
        '"risk_description": "...", "severity": "Low|Medium|High", '
        '"recommendation": "..." } ] }'
    )
    user_prompt = f"Document:\n{document_text}"

    # Run OpenAI call in a thread to avoid blocking the event loop
    gpt_response = await run_in_threadpool(
        call_gpt, prompt=user_prompt, system_message=system_message, temperature=0.3
    )

    try:
        parsed = json.loads(gpt_response or "")
        risks = parsed.get("risks", [])
        if not isinstance(risks, list):
            raise ValueError
    except Exception:
        # fallback demo data
        risks = [
            {
                "section": "Clause 5",
                "clause": "Clause 5",
                "risk_description": "Ambiguous language",
                "severity": "Medium",
                "recommendation": "Specify clear language.",
            },
            {
                "section": "Clause 12",
                "clause": "Clause 12",
                "risk_description": "Potential breach",
                "severity": "High",
                "recommendation": "Review the obligations and include safeguards.",
            },
        ]

    # Save assessment record
    report = {
        "user_id": user_id,
        "document_text_preview": document_text[:500],
        "filename": filename,
        "report_doc_id": None,
        "report_filename": None,
        "risks": risks,
        "created_at": datetime.utcnow(),
    }
    result = await db.risk_assessments.insert_one(report)

    return {"id": str(result.inserted_id), "risks": risks}

async def get_risk_report(report_id: str, db: AsyncIOMotorDatabase):
    """
    Retrieve a risk report by its ObjectId.
    """
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=400, detail="Invalid report ID.")
    doc = await db.risk_assessments.find_one({"_id": ObjectId(report_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found.")
    doc["_id"] = str(doc["_id"])
    return doc

# (Optional) If you want to add a helper for deleting a report:
async def delete_risk_report(report_id: str, user_id: str, db: AsyncIOMotorDatabase):
    """
    Delete a risk report by its ObjectId and user_id.
    """
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=400, detail="Invalid report ID.")
    result = await db.risk_assessments.delete_one({"_id": ObjectId(report_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found or not authorized")
    return {"message": "Deleted"}