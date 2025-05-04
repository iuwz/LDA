# backend/app/mvc/views/compliance.py

import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field
from typing import Optional
from fastapi.responses import StreamingResponse, Response
from io import BytesIO
from urllib.parse import quote

from app.mvc.controllers.compliance import (
    run_compliance_check,
    get_compliance_report,
    generate_compliance_report_docx,
    generate_compliance_report_pdf,
)
from app.utils.security import get_current_user
from app.mvc.models.user import UserInDB
from app.mvc.models.compliance import ComplianceReportResponse, ComplianceReport

router = APIRouter(tags=["Compliance"])
logger = logging.getLogger(__name__)


class ComplianceRequest(BaseModel):
    document_text: Optional[str] = Field(
        None, description="Text to check (if no doc_id provided)"
    )
    doc_id: Optional[str] = Field(
        None, description="ID of uploaded document to check"
    )


@router.post("/check", response_model=ComplianceReportResponse)
async def check_compliance(
    request_body: ComplianceRequest,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Run compliance check by text or existing document. Returns report_id + issues.
    """
    db = request.app.state.db
    try:
        if request_body.document_text is not None:
            result = await run_compliance_check(
                db=db, user_id=current_user.email, document_text=request_body.document_text
            )
        elif request_body.doc_id is not None:
            result = await run_compliance_check(
                db=db, user_id=current_user.email, doc_id=request_body.doc_id
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Either document_text or doc_id must be provided."
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /compliance/check: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/download/{report_id}", response_class=Response)
async def download_compliance_report_docx(
    report_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Stream back a DOCX compliance report.
    """
    db = request.app.state.db
    report = await get_compliance_report(db=db, report_id=report_id, user_id=current_user.email)

    docx_buf = generate_compliance_report_docx(report)
    if docx_buf is None:
        raise HTTPException(status_code=500, detail="Failed to generate DOCX.")

    filename = f"compliance_report_{report_id}.docx"
    headers = {
        "Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}",
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }

    async def iter_docx():
        docx_buf.seek(0)
        yield docx_buf.getvalue()

    return StreamingResponse(iter_docx(), headers=headers, media_type=headers["Content-Type"])


@router.get("/report/pdf/{report_id}", response_class=StreamingResponse)
async def download_compliance_report_pdf(
    report_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Stream back a PDF compliance report.
    """
    db = request.app.state.db
    report = await get_compliance_report(db=db, report_id=report_id, user_id=current_user.email)

    pdf_buf = generate_compliance_report_pdf(report)

    filename = f"compliance_report_{report_id}.pdf"
    headers = {
        "Content-Disposition": f"attachment; filename=\"{filename}\"",
        "Content-Type": "application/pdf",
    }

    pdf_buf.seek(0)
    return StreamingResponse(pdf_buf, headers=headers, media_type="application/pdf")
