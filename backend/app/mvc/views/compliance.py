# app/mvc/views/compliance.py

import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

# Import logic from the controller
from app.mvc.controllers.compliance import run_compliance_check, get_compliance_report

router = APIRouter()
logger = logging.getLogger(__name__)

# In Swagger UI, this ensures the "Authorize" button appears.
http_bearer = HTTPBearer()

class ComplianceRequest(BaseModel):
    """
    Defines the body for the compliance check request.
    """
    document_text: str


@router.post("/check")
async def check_compliance(
    request_body: ComplianceRequest,
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer)
):
    """
    Run a compliance check on the given document text using GPT-based analysis
    with a fallback to mock rule-based logic if GPT fails.

    This endpoint requires:
      - A valid Bearer token (provided in the Authorization header).
      - A JSON body with 'document_text'.

    It returns a JSON response with:
      {
        "report_id": <str>,
        "issues": [
          {
            "rule_id": ...,
            "description": ...,
            "status": ...
          }
          ...
        ]
      }
    """
    user_id = request.state.user_id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated.")

    db = request.app.state.db
    logger.info(f"Received compliance check request from user_id={user_id}")

    result = await run_compliance_check(db, request_body.document_text, user_id)
    return {
        "compliance_result": result
    }


@router.get("/report/{report_id}")
async def fetch_compliance_report(
    report_id: str,
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer)
):
    """
    Retrieve a compliance report by its ID. Only the user who created
    the report can access it.

    This endpoint requires:
      - A valid Bearer token.
      - A path parameter 'report_id' (string representation of MongoDB ObjectId).

    It returns a JSON response with the stored report:
      {
        "_id": <str>,
        "user_id": <str>,
        "document_text": <str>,
        "issues": [...]
      }
    or raises 403 if the user does not own the report.
    """
    user_id = request.state.user_id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated.")

    db = request.app.state.db
    logger.info(f"Fetching compliance report {report_id} for user_id={user_id}")

    report = await get_compliance_report(db, report_id, user_id)
    return {
        "compliance_report": report
    }
