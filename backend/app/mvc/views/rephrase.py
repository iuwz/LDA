# app/mvc/views/rephrase.py

import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.mvc.controllers.rephrase import run_rephrase_tool, get_rephrase_report

router = APIRouter()
logger = logging.getLogger(__name__)

# Declare an HTTPBearer for Swagger "Authorize" button
bearer_scheme = HTTPBearer()

class RephraseRequest(BaseModel):
    """
    Defines the structure of the request body for the rephrase endpoint.
    """
    document_text: str


@router.post("/")
async def rephrase_document(
    request_body: RephraseRequest,
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    """
    Rephrase the given document text for clarity while preserving meaning.
    Requires a Bearer JWT token for authentication.

    Body JSON example:
    {
        "document_text": "Some ambiguous legal text..."
    }

    Returns a JSON object of the form:
    {
        "rephrase_result": {
            "report_id": <str>,
            "rephrased_text": <str>
        }
    }
    """
    user_id = request.state.user_id
    if not user_id:
        logger.warning("No user_id found in request.state. Unauthorized.")
        raise HTTPException(status_code=401, detail="User not authenticated")

    db: AsyncIOMotorDatabase = request.app.state.db
    logger.info(f"Received rephrase request from user_id={user_id}")

    # Call the controller to perform GPT-based (or fallback) rephrasing
    result = await run_rephrase_tool(db, request_body.document_text, user_id)

    # Return in a consistent structure
    return {
        "rephrase_result": result
    }


@router.get("/{report_id}")
async def fetch_rephrased_document(
    report_id: str,
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    """
    Retrieves a specific rephrase record by ID. 
    Requires a Bearer JWT token for authentication.

    Path parameter: <report_id> (MongoDB ObjectId as a string).

    Sample request:
        GET /rephrase/63f8bad21e754503f0f4abc1

    Returns:
    {
        "rephrase_report": {
            "_id": <str>,
            "user_id": <str>,
            "original_text": <str>,
            "rephrased_text": <str>
        }
    }
    or raises 403 if this record belongs to another user.
    """
    user_id = request.state.user_id
    if not user_id:
        logger.warning("No user_id found in request.state. Unauthorized.")
        raise HTTPException(status_code=401, detail="User not authenticated")

    db: AsyncIOMotorDatabase = request.app.state.db
    logger.info(f"Fetching rephrase report {report_id} for user_id={user_id}")

    doc = await get_rephrase_report(db, report_id, user_id)
    return {"rephrase_report": doc}
