# backend/app/mvc/views/chatbot.py

import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.mvc.controllers.chatbot import run_chatbot_query

router = APIRouter()
logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer()

class ChatbotRequest(BaseModel):
    query: str

@router.post("/")
async def chatbot_interaction(
    request_body: ChatbotRequest,
    request: Request,
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    """
    POST /chatbot/
    Send a query to the AI legal chatbot. Requires authentication.
    """
    user_id = request.state.user_id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    db: AsyncIOMotorDatabase = request.app.state.db

    result = await run_chatbot_query(db, user_id, request_body.query)
    return result
