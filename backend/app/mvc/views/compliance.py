# backend/app/mvc/views/compliance.py
from __future__ import annotations

import datetime as _dt
import logging
from io import BytesIO
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field

from app.mvc.controllers.compliance import (
    run_compliance_check,
    get_compliance_report,
    generate_compliance_report_docx,
    generate_compliance_report_pdf,
)
from app.utils.security import get_current_user
from app.mvc.models.user import UserInDB
from app.mvc.models.compliance import ComplianceReportResponse

router = APIRouter(tags=["Compliance"])
log = logging.getLogger(__name__)


# ─────────────────────────  Schemas  ─────────────────────────
class ComplianceRequest(BaseModel):
    document_text: Optional[str] = Field(
        None, description="Raw text of the document"
    )
    doc_id: Optional[str] = Field(
        None, description="Existing uploaded document‑id"
    )


# ───────────────────────  /check  (POST)  ─────────────────────
@router.post("/check", response_model=ComplianceReportResponse)
async def check_compliance(
    body: ComplianceRequest,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    if body.document_text is None and body.doc_id is None:
        raise HTTPException(400, "Either document_text or doc_id must be provided.")
    try:
        if body.document_text is not None:
            return await run_compliance_check(
                db, current_user.email, document_text=body.document_text
            )
        return await run_compliance_check(db, current_user.email, doc_id=body.doc_id)
    except HTTPException:
        raise
    except Exception as e:
        log.error("/compliance/check failed", exc_info=True)
        raise HTTPException(500, str(e))


# ──────────────────────────  HISTORY  ─────────────────────────
@router.get("/history")
async def list_my_compliance_reports(
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    items = []
    async for row in (
        db.compliance_reports.find({"user_id": current_user.email}).sort("_id", -1)
    ):
        items.append(
            {
                "id": str(row["_id"]),
                "created_at": row.get("timestamp", _dt.datetime.utcnow()),
                "num_issues": len(row.get("issues", [])),
                "report_filename": row.get("report_filename"),
                "report_doc_id": row.get("report_doc_id"),
            }
        )
    return {"history": items}


# ───────────────────────────  GET ONE  ────────────────────────
@router.get("/{report_id}")
async def fetch_compliance_report(
    report_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    doc = await get_compliance_report(db, report_id, current_user.email)
    return {"compliance_report": doc}


# ───────────────────────────  DELETE  ─────────────────────────
@router.delete("/{report_id}")
async def delete_compliance_report(
    report_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    doc = await get_compliance_report(db, report_id, current_user.email)
    await db.compliance_reports.delete_one({"_id": doc["_id"]})
    return {"ok": True}


# ──────────────────────  DOCX download  ───────────────────────
@router.get("/report/download/{report_id}", response_class=Response)
async def download_docx(
    report_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    rpt = await get_compliance_report(db, report_id, current_user.email)
    buf = generate_compliance_report_docx(rpt)
    fn = f"compliance_report_{report_id}.docx"
    hdrs = {
        "Content-Disposition": f"attachment; filename*=UTF-8''{quote(fn)}",
        "Content-Type": (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
    }

    async def _iter():
        buf.seek(0)
        yield buf.getvalue()

    return StreamingResponse(_iter(), headers=hdrs, media_type=hdrs["Content-Type"])


# ───────────────────────  PDF download  ───────────────────────
@router.get("/report/pdf/{report_id}", response_class=StreamingResponse)
async def download_pdf(
    report_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    rpt = await get_compliance_report(db, report_id, current_user.email)
    buf = generate_compliance_report_pdf(rpt)
    fn = f"compliance_report_{report_id}.pdf"
    hdrs = {
        "Content-Disposition": f"attachment; filename=\"{fn}\"",
        "Content-Type": "application/pdf",
    }
    buf.seek(0)
    return StreamingResponse(buf, headers=hdrs, media_type="application/pdf")
