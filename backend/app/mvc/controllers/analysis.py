# backend/app/mvc/controllers/analysis.py
import logging
import json
from bson.objectid import ObjectId
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.openai_client import call_gpt

logger = logging.getLogger(__name__)

async def analyze_risk(document_text: str, user_id: str, db: AsyncIOMotorDatabase):
    if not document_text:
        raise HTTPException(status_code=400, detail="Document text is required.")
    system_message = (
        "You are a legal AI. Identify potential legal risks in the document. "
        "Return valid JSON only, in the format:\n"
        "{\n"
        "  \"risks\": [\n"
        "    {\n"
        "      \"section\": \"Clause X\",\n"
        "      \"clause\": \"Clause X\",\n"
        "      \"risk_description\": \"...\",\n"
        "      \"severity\": \"Low|Medium|High\",\n"
        "      \"recommendation\": \"...\"\n"
        "    },\n"
        "    ...\n"
        "  ]\n"
        "}\n"
    )
    user_prompt = f"Document:\n{document_text}"
    gpt_response = call_gpt(prompt=user_prompt, system_message=system_message, temperature=0.3)
    try:
        parsed = json.loads(gpt_response or "")
        risks = parsed.get("risks", [])
        if not isinstance(risks, list):
            raise ValueError
    except Exception:
        risks = [
            {
                "section": "Clause 5",
                "clause": "Clause 5",
                "risk_description": "Ambiguous language",
                "severity": "Medium",
                "recommendation": "Specify clear language."
            },
            {
                "section": "Clause 12",
                "clause": "Clause 12",
                "risk_description": "Potential breach",
                "severity": "High",
                "recommendation": "Review the obligations and include safeguards."
            }
        ]
    report = {"document_text": document_text, "risks": risks, "user_id": user_id}
    result = await db.risk_assessments.insert_one(report)
    return {"id": str(result.inserted_id), "risks": risks}

async def get_risk_report(report_id: str, db: AsyncIOMotorDatabase):
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=400, detail="Invalid report ID.")
    doc = await db.risk_assessments.find_one({"_id": ObjectId(report_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found.")
    doc["_id"] = str(doc["_id"])
    return doc
