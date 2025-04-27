import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from app.mvc.controllers.rephrase import run_rephrase_tool, get_rephrase_report
from app.utils.security import get_current_user
from app.mvc.models.user import UserInDB

router = APIRouter(tags=["Rephrase"])
logger = logging.getLogger(__name__)

class RephraseRequest(BaseModel):
    document_text: str

@router.post("/")
async def rephrase_document(
    request_body: RephraseRequest,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Rephrase text for clarity. Returns {"report_id", "rephrased_text"}.
    """
    user_id = current_user.email
    db = request.app.state.db

    try:
        return await run_rephrase_tool(db, request_body.document_text, user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Rephrase error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{report_id}")
async def fetch_rephrase_report(
    report_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Retrieve a rephrase record by ID.
    """
    user_id = current_user.email
    db = request.app.state.db

    try:
        report = await get_rephrase_report(db, report_id, user_id)
        return report
    except HTTPException:
        raise
