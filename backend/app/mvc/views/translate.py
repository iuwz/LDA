from fastapi import APIRouter, HTTPException, Request, Depends, UploadFile, File, Form, Response
from pydantic import BaseModel
from app.mvc.controllers.translate import run_translation_tool, run_file_translation_tool
from app.utils.security import get_current_user
from app.mvc.models.user import UserInDB
import logging

router = APIRouter(tags=["Translation"])
logger = logging.getLogger(__name__)

class TranslationRequest(BaseModel):
    document_text: str
    target_lang: str

@router.post("/", summary="Translate text into a target language")
async def translate_document(
    request: Request,
    request_body: TranslationRequest,
    current_user: UserInDB = Depends(get_current_user),
):
    user_id = current_user.email
    db = request.app.state.db
    try:
        return await run_translation_tool(
            db=db,
            document_text=request_body.document_text,
            target_lang=request_body.target_lang,
            user_id=user_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Translation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/file", summary="Translate an uploaded document")
async def translate_document_file(
    request: Request,
    file: UploadFile = File(...),
    target_lang: str = Form(...),
    current_user: UserInDB = Depends(get_current_user),
):
    user_id = current_user.email
    db = request.app.state.db
    try:
        translated_content, translated_filename = await run_file_translation_tool(
            db=db,
            file=file,
            target_lang=target_lang,
            user_id=user_id,
        )

        headers = {
            "Content-Disposition": f'attachment; filename="{translated_filename}"'
        }
        return Response(
            content=translated_content,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers=headers
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File translation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
