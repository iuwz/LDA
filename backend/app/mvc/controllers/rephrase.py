# rephrase.py

import logging
import json
from fastapi import HTTPException
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

# Import GPT helper
from app.core.openai_client import call_gpt

logger = logging.getLogger(__name__)

async def run_rephrase_tool(db: AsyncIOMotorDatabase, document_text: str, user_id: str):
    """
    Rephrases the given legal text for clarity while preserving meaning.
    Attempts a GPT-based rephrase first; if GPT fails or returns invalid JSON,
    falls back to a mock "[REPHRASED FOR CLARITY]" logic.

    The rephrased version is stored in 'rephrase_reports' collection.
    Returns:
      {
        "report_id": <ObjectId as string>,
        "rephrased_text": <string>
      }
    """

    if not document_text:
        raise HTTPException(status_code=400, detail="Document text is required for rephrasing.")

    logger.info(f"Running rephrase for user_id={user_id}")

    # --------------------------------------------------------------------------
    # 1) Attempt GPT-based rephrase
    # --------------------------------------------------------------------------
    system_message = (
        "You are a legal rewriting AI. You rephrase the given text for better clarity "
        "and correctness, while preserving its original meaning. Return valid JSON ONLY, "
        "in the format:\n"
        "{\n"
        "  \"rephrased_text\": \"...\"\n"
        "}\n"
        "Do not include any additional keys or text."
    )

    user_prompt = f"Text to rephrase:\n{document_text}"

    gpt_response = call_gpt(
        prompt=user_prompt,
        system_message=system_message,
        temperature=0.4  # Adjust for more/less creative rephrasing
    )

    rephrased_text = None

    if gpt_response:
        try:
            parsed = json.loads(gpt_response)
            if "rephrased_text" in parsed:
                rephrased_text = parsed["rephrased_text"].strip()
                logger.info("Successfully parsed GPT rephrased text.")
            else:
                logger.warning("GPT response does not contain 'rephrased_text'. Using fallback logic.")
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse GPT rephrase response as JSON: {e}. Using fallback logic.")
    else:
        logger.warning("GPT call returned no response. Using fallback logic.")

    # --------------------------------------------------------------------------
    # 2) Fallback logic if GPT doesn't provide a valid rephrased_text
    # --------------------------------------------------------------------------
    if not rephrased_text:
        rephrased_text = f"{document_text} [REPHRASED FOR CLARITY]"
        logger.info("Using fallback rephrased text.")

    # --------------------------------------------------------------------------
    # 3) Store the final version in MongoDB
    # --------------------------------------------------------------------------
    rephrase_record = {
        "user_id": user_id,
        "original_text": document_text,
        "rephrased_text": rephrased_text
    }

    try:
        result = await db.rephrase_reports.insert_one(rephrase_record)
        logger.info(f"Rephrase record stored with ID: {result.inserted_id}")
    except Exception as e:
        logger.error(f"Error inserting rephrase record: {e}")
        raise HTTPException(status_code=500, detail="Failed to store rephrase record in the database.")

    # --------------------------------------------------------------------------
    # 4) Return final summary
    # --------------------------------------------------------------------------
    return {
        "report_id": str(result.inserted_id),
        "rephrased_text": rephrased_text
    }

async def get_rephrase_report(db: AsyncIOMotorDatabase, report_id: str, user_id: str):
    """
    Retrieves a specific rephrase report by its ID and ensures the record belongs to 'user_id'.
    Returns:
      The entire document, including _id (as a string), user_id, original_text, and rephrased_text.
    
    Raises:
      400 - if the report_id is invalid
      404 - if no record is found
      403 - if it belongs to another user
    """
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=400, detail="Invalid report ID format.")

    record = await db.rephrase_reports.find_one({"_id": ObjectId(report_id)})
    if not record:
        raise HTTPException(status_code=404, detail="Rephrase report not found.")

    # Enforce ownership
    if record.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied (not your report).")

    record["_id"] = str(record["_id"])
    logger.info(f"Rephrase report {report_id} retrieved for user {user_id}.")
    return record
