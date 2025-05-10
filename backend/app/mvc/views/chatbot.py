import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel

from backend.app.mvc.controllers.chatbot import chat as chat_logic, list_sessions, get_messages
from backend.app.utils.security import get_current_user
from backend.app.mvc.models.user import UserInDB

router = APIRouter(tags=["Chatbot"])
logger = logging.getLogger(__name__)


class ChatReq(BaseModel):
    query: str
    session_id: Optional[str] = None


@router.post("/")
async def chat_endpoint(
    body: ChatReq,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    try:
        return await chat_logic(
            db,
            user_id=str(current_user.id),  # **now uses _id, not email – unique & immutable**
            query=body.query,
            session_id=body.session_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:  # pragma: no cover
        logger.error("Chat endpoint failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal chatbot error")


@router.get("/history")
async def history_endpoint(
    request: Request, current_user: UserInDB = Depends(get_current_user)
):
    db = request.app.state.db
    return await list_sessions(db, str(current_user.id))


@router.get("/session/{session_id}")
async def messages_endpoint(
    session_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    try:
        return {"messages": await get_messages(db, str(current_user.id), session_id)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
