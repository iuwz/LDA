# backend/app/mvc/views/analysis.py

import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from backend.app.mvc.controllers.analysis import analyze_risk, get_risk_report
from backend.app.utils.security import get_current_user
from backend.app.mvc.models.user import UserInDB

router = APIRouter(tags=["Analysis"])

class RiskAnalysisRequest(BaseModel):
    document_text: str

@router.post("/risk", tags=["Analysis"])
async def analyze_risk_endpoint(
    request_data: RiskAnalysisRequest,
    *,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    API endpoint to analyze legal document risk.
    Expects JSON body {"document_text": "..."}.
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

@router.get("/risk", tags=["Analysis"])
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
        async for report in db.risk_assessments.find({"user_id": user_id}):
            report["_id"] = str(report["_id"])
            reports.append(report)
        logging.info(f"Returning {len(reports)} reports for user_id {user_id}")
        return reports
    except Exception as e:
        logging.error(f"Error listing risk reports for user_id {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/risk/{report_id}", tags=["Analysis"])
async def get_risk_report_endpoint(
    report_id: str,
    *,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Retrieve a risk report by ID. Only the user who submitted it may access.
    """
    db = request.app.state.db
    user_id = current_user.email

    try:
        result = await get_risk_report(report_id, db)
        if result.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied. This report does not belong to you.")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Internal server error while retrieving report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
