import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from app.mvc.controllers.translate import run_translation_tool
from app.utils.security import get_current_user
from app.mvc.models.user import UserInDB

router = APIRouter(tags=["Translation"])
logger = logging.getLogger(__name__)

class TranslationRequest(BaseModel):
    document_text: str
    target_lang: str

@router.post("/")
async def translate_document(
    request_body: TranslationRequest,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Translate text into the specified language.
    """
    user_id = current_user.email
    db = request.app.state.db

    try:
        return await run_translation_tool(
            db=db,
            document_text=request_body.document_text,
            target_lang=request_body.target_lang,
            user_id=user_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Translation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
