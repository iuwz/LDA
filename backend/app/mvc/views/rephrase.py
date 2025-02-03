import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.mvc.controllers.rephrase import run_rephrase_tool

router = APIRouter()
logger = logging.getLogger(__name__)

# Declare an HTTPBearer for Swagger
bearer_scheme = HTTPBearer()

class RephraseRequest(BaseModel):
    document_text: str

@router.post("/")
async def rephrase_document(
    request_body: RephraseRequest,
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    """
    Endpoint to rephrase the given document text.
    Requires JWT token (Bearer).
    """
    user_id = request.state.user_id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    db: AsyncIOMotorDatabase = request.app.state.db
    result = await run_rephrase_tool(db, request_body.document_text, user_id)
    return result
