import logging
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

async def run_translation_tool(
    db: AsyncIOMotorDatabase,
    document_text: str,
    target_lang: str,
    user_id: str
):
    """
    Mock translation logic:
    - In real usage, you'd call a translation API or ML model (like Google Cloud Translate, DeepL, etc.)
    - We'll just append "[translated to XYZ]" for demonstration.
    - Optionally store the translation record in MongoDB for reference.
    """
    if not document_text:
        raise HTTPException(status_code=400, detail="Document text is required for translation")
    if not target_lang:
        raise HTTPException(status_code=400, detail="Target language is missing")

    logger.info(f"Translating text for user_id={user_id} into {target_lang}")

    # Mock translation:
    translated_text = f"{document_text} [TRANSLATED to {target_lang.upper()}]"

    # Optionally store in DB
    translation_record = {
        "user_id": user_id,
        "original_text": document_text,
        "target_lang": target_lang,
        "translated_text": translated_text
    }
    result = await db.translation_reports.insert_one(translation_record)
    logger.info(f"Stored translation record with _id={result.inserted_id}")

    return {
        "report_id": str(result.inserted_id),
        "translated_text": translated_text
    }
