import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from app.mvc.controllers.chatbot import run_chatbot_query
from app.utils.security import get_current_user
from app.mvc.models.user import UserInDB

router = APIRouter(tags=["Chatbot"])
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    query: str

@router.post("/")
async def chat_with_bot(
    request_body: ChatRequest,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    POST /chatbot/
    """
    user_id = current_user.email
    db = request.app.state.db

    try:
        result = await run_chatbot_query(
            db=db,
            user_id=user_id,
            query=request_body.query
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chatbot failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Chatbot query failed due to an internal error")
