import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from bson import ObjectId

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Import the logic from the controller
from app.mvc.controllers.compliance import run_compliance_check, get_compliance_report

router = APIRouter()
logger = logging.getLogger(__name__)

# This tells Swagger there's a Bearer scheme
http_bearer = HTTPBearer()

class ComplianceRequest(BaseModel):
    document_text: str


@router.post("/")
async def check_compliance(
    request_body: ComplianceRequest,
    request: Request,
    # The presence of this Depends(...) is what tells Swagger
    # to include "Authorize" button & attach Bearer token
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer)
):
    """
    Run a compliance check on the given document text.
    Requires Bearer token (from login).
    """
    user_id = request.state.user_id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    db = request.app.state.db
    result = await run_compliance_check(db, request_body.document_text, user_id)
    return result


@router.get("/{report_id}")
async def fetch_compliance_report(
    report_id: str,
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer)
):
    """
    Retrieve a compliance report by ID (requires valid token).
    """
    user_id = request.state.user_id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    db = request.app.state.db
    report = await get_compliance_report(db, report_id, user_id)
    return report
