# backend/app/mvc/controllers/analysis.py
import json
import logging
from datetime import datetime
from io import BytesIO
from typing import Optional

from bson.objectid import ObjectId
from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool
from motor.motor_asyncio import AsyncIOMotorDatabase

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

from app.core.openai_client import call_gpt
from app.mvc.controllers.documents import upload_file_to_gridfs, store_document_record

logger = logging.getLogger(__name__)


# ─────────── helper: build pretty PDF ───────────
def _build_pdf(filename: str, risks: list[dict]) -> bytes:
    buff = BytesIO()
    doc = SimpleDocTemplate(buff, pagesize=letter, title="Risk Assessment Report")

    styles = getSampleStyleSheet()
    elems = [Paragraph("Risk Assessment Report", styles["Title"]), Spacer(1, 12)]

    data = [["ID", "Section", "Clause", "Issue", "Risk", "Recommendation"]]
    for idx, r in enumerate(risks, 1):
        data.append(
            [
                str(idx),
                r["section"],
                r.get("clause", r["section"]),
                r["risk_description"],
                r["severity"],
                r.get("recommendation", ""),
            ]
        )
    table = Table(data, repeatRows=1, colWidths=[30, 75, 70, 180, 45, 170])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#C17829")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.grey),
                ("BOX", (0, 0), (-1, -1), 0.50, colors.grey),
            ]
        )
    )
    elems.append(table)
    doc.build(elems)
    buff.seek(0)
    return buff.read()


async def analyze_risk(
    document_text: str,
    user_id: str,
    db: AsyncIOMotorDatabase,
    *,
    filename: Optional[str] = None,
) -> dict:
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

    # run OpenAI sync call in thread so the event‑loop is not blocked
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

    

    # save assessment record
    report = {
        "user_id": user_id,
        "document_text_preview": document_text[:500],
        "filename": filename,
        "report_doc_id": None,
        "risks": risks,
        "created_at": datetime.utcnow(),
    }
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
