import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.mvc.controllers.translate import run_translation_tool

router = APIRouter()
logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer()

class TranslationRequest(BaseModel):
    document_text: str
    target_lang: str

@router.post("/")
async def translate_document(
    request_body: TranslationRequest,
    request: Request,
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    """
    POST /translate/
    Translate the given document text into the specified target language.
    """
    user_id = request.state.user_id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    db: AsyncIOMotorDatabase = request.app.state.db

    result = await run_translation_tool(
        db,
        document_text=request_body.document_text,
        target_lang=request_body.target_lang,
        user_id=user_id
    )
    return result
