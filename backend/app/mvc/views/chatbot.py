import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase

# Import the new controller function
from app.mvc.controllers.chatbot import run_chatbot_query

router = APIRouter()
logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer()

class ChatRequest(BaseModel):
    query: str

@router.post("/")
async def chat_with_bot(
    request_body: ChatRequest,
    request: Request,
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    """
    POST /chat (if main.py uses `app.include_router(router, prefix="/chat")`)

    Request body example:
    {
      "query": "What clauses should I include in a standard NDA?"
    }

    Steps:
    1) Check user_id from request state or fallback to 'demo_user'.
    2) Call run_chatbot_query -> calls GPT, stores record in Mongo, returns data.
    3) Return JSON with { "session_id", "bot_response" }.
    """
    user_id = request.state.user_id if hasattr(request.state, "user_id") else "demo_user"
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated"
        )

    db: AsyncIOMotorDatabase = request.app.state.db

    try:
        result = await run_chatbot_query(
            db=db,
            user_id=user_id,
            query=request_body.query
        )
        return result
    except Exception as e:
        logger.error(f"Chatbot failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Chatbot query failed due to an internal error"
        )
