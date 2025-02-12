import os
import logging
from dotenv import load_dotenv
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.openai_client import call_gpt  # Keep using openai_client.py

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

async def run_translation_tool(
    db: AsyncIOMotorDatabase,
    document_text: str,
    target_lang: str,
    user_id: str
):
    """
    AI-powered translation function using OpenAI's GPT-4o mini.
    """
    if not document_text:
        raise HTTPException(status_code=400, detail="Document text is required for translation")
    if not target_lang:
        raise HTTPException(status_code=400, detail="Target language is missing")

    logger.info(f"Translating text for user_id={user_id} into {target_lang}")

    try:
        system_message = f"You are a professional legal translator. Translate the text into {target_lang.upper()} accurately."
        user_message = f"Translate this legal document into {target_lang.upper()}:\n\n{document_text}"

        # ✅ Ensure GPT-4o Mini is used explicitly
        translated_text = call_gpt(
            prompt=user_message,
            system_message=system_message,
            temperature=0.0
        )

        if not translated_text:
            raise Exception("Translation response was empty")

    except Exception as e:
        logger.error(f"Error during translation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Translation failed due to an internal error")

    # Store translation in MongoDB
    translation_record = {
        "user_id": user_id,
        "original_text": document_text,
        "target_lang": target_lang,
        "translated_text": translated_text,
    }

    result = await db.translation_reports.insert_one(translation_record)
    logger.info(f"Stored translation record with _id={result.inserted_id}")

    return {
        "report_id": str(result.inserted_id),
        "translated_text": translated_text
    }
