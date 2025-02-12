import os
import logging
from dotenv import load_dotenv
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

# Keep using openai_client.py, just like the translation tool
from app.core.openai_client import call_gpt

# Load environment variables (if needed)
load_dotenv()

logger = logging.getLogger(__name__)

async def run_chatbot_query(
    db: AsyncIOMotorDatabase,
    user_id: str,
    query: str
):
    """
    AI-powered chatbot function using GPT-4o Mini or your chosen model.

    1) Validates the user query.
    2) Calls `call_gpt` with a specialized system message for legal Q&A.
    3) Stores the chatbot result in MongoDB.
    4) Returns a JSON-like response with session_id and the bot's answer.
    """
    if not query:
        raise HTTPException(
            status_code=400,
            detail="Query is required"
        )

    logger.info(f"Chatbot query for user_id={user_id}: {query}")

    try:
        system_message = (
            "You are a specialized legal AI assistant. "
            "Answer the user's query in a concise, professional manner. "
            "If the question is not legal, politely refuse."
        )
        user_message = f"User's query:\n{query}"

        # Call GPT using the same approach as translation tool
        chatbot_answer = call_gpt(
            prompt=user_message,
            system_message=system_message,
            temperature=0.0  # or whatever temperature you prefer
        )

        if not chatbot_answer:
            raise Exception("Chatbot response was empty")

    except Exception as e:
        logger.error(f"Error during chatbot query: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Chatbot query failed due to an internal error"
        )

    # Store conversation in MongoDB
    chat_record = {
        "user_id": user_id,
        "query": query,
        "response": chatbot_answer
    }
    result = await db.chatbot_sessions.insert_one(chat_record)
    logger.info(f"Stored chatbot record with _id={result.inserted_id}")

    return {
        "session_id": str(result.inserted_id),
        "bot_response": chatbot_answer
    }
