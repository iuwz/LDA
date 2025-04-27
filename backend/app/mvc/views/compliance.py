import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from app.mvc.controllers.compliance import run_compliance_check, get_compliance_report
from app.utils.security import get_current_user
from app.mvc.models.user import UserInDB

router = APIRouter(tags=["Compliance"])
logger = logging.getLogger(__name__)

class ComplianceRequest(BaseModel):
    document_text: str

@router.post("/check")
async def check_compliance(
    request_body: ComplianceRequest,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Run a compliance check. Returns {"report_id", "issues": [...]}
    """
    user_id = current_user.email
    db = request.app.state.db

    try:
        return await run_compliance_check(
            db=db,
            document_text=request_body.document_text,
            user_id=user_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Compliance check error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/report/{report_id}")
async def fetch_compliance_report(
    report_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Retrieve a compliance report by ID. Only accessible by its creator.
    """
    user_id = current_user.email
    db = request.app.state.db

    try:
        report = await get_compliance_report(
            db=db,
            report_id=report_id,
            user_id=user_id
        )
        return report
    except HTTPException:
        raise
