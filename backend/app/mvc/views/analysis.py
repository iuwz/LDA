# backend/app/mvc/views/analysis.py

import logging
from fastapi import APIRouter, HTTPException, Request, Depends, UploadFile, File
from pydantic import BaseModel
from bson import ObjectId

from backend.app.mvc.controllers.analysis import analyze_risk, get_risk_report
from backend.app.mvc.controllers.documents import upload_file_to_gridfs
from backend.app.utils.security import get_current_user
from backend.app.mvc.models.user import UserInDB

router = APIRouter(prefix="/risk", tags=["Risk"])


class RiskAnalysisRequest(BaseModel):
    document_text: str


@router.post("/", tags=["Analyze"])
async def analyze_risk_endpoint(
    request_data: RiskAnalysisRequest,
    *,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Analyze legal document risk.
    Expects JSON body: { "document_text": "..." }.
    Returns { "id": "...", "risks": [...] }.
    """
    db = request.app.state.db
    user_id = current_user.email

    logging.info(f"Analyzing risk for user_id: {user_id}")
    try:
        result = await analyze_risk(request_data.document_text, user_id, db)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Internal server error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/", tags=["List"])
async def list_user_risk_reports(
    *,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    List all risk reports for the logged-in user.
    """
    db = request.app.state.db
    user_id = current_user.email

    try:
        reports = []
        async for report in db.risk_assessments.find({"user_id": user_id}).sort("_id", -1):
            report["_id"] = str(report["_id"])
            reports.append(report)
        logging.info(f"Returning {len(reports)} reports for user_id {user_id}")
        return reports
    except Exception as e:
        logging.error(f"Error listing risk reports for user_id {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{report_id}", tags=["Get"])
async def get_risk_report_endpoint(
    report_id: str,
    *,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Retrieve a risk report by ID. Only the owner may access.
    """
    db = request.app.state.db
    user_id = current_user.email

    try:
        result = await get_risk_report(report_id, db)
        if result.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied.")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Internal server error while retrieving report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{report_id}/upload-pdf", tags=["Upload"])
async def upload_risk_pdf(
    report_id: str,
    file: UploadFile = File(...),
    *,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Upload a PDF file for an existing risk report.
    Stores the PDF in GridFS and updates the report record.
    Returns { "report_doc_id": "...", "filename": "..." }.
    """
    db = request.app.state.db
    user_id = current_user.email

    # Verify the report exists and belongs to this user
    report = await db.risk_assessments.find_one({"_id": ObjectId(report_id)})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    if report.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Save the PDF to GridFS
    file_id = await upload_file_to_gridfs(file, db)

    # Update the report with the new document reference
    await db.risk_assessments.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {"report_doc_id": str(file_id), "report_filename": file.filename}},
    )

    return {"report_doc_id": str(file_id), "filename": file.filename}
