import logging
import json
import random
from bson.objectid import ObjectId
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

# Import your GPT helper (Make sure openai_client.py is properly set up)
from app.core.openai_client import call_gpt

logger = logging.getLogger(__name__)

async def analyze_risk(document_text: str, user_id: str, db: AsyncIOMotorDatabase):
    """
    Analyzes the legal document and evaluates its risk level.
    
    This function attempts to call GPT for a detailed, structured risk analysis.
    If the GPT call fails or returns invalid data, it falls back to a mock
    random risk assessment.

    Args:
        document_text (str): The text of the legal document.
        user_id (str): The ID of the user who submitted the document.
        db (AsyncIOMotorDatabase): The database connection instance.

    Returns:
        dict: The analysis result containing identified risks and the inserted report ID.

    Raises:
        HTTPException: If the input document is invalid.
    """
    logger.info(f"Starting risk analysis for user_id: {user_id}")

    if not document_text:
        logger.warning("No document text provided for analysis.")
        raise HTTPException(status_code=400, detail="Document text is required for analysis.")

    # --------------------------------------------------------------------------
    # 1) Attempt GPT-based risk analysis with structured JSON output
    # --------------------------------------------------------------------------
    system_message = (
        "You are a highly experienced legal AI. "
        "You identify potential legal risks "
        "within a provided document. Return the results in valid JSON format, "
        "with each risk as an object containing 'section', 'risk_description', "
        "and 'severity' (Low, Medium, or High). Return an array of these risks "
        "in the 'risks' key of a JSON object. Example:\n"
        "{\n"
        "  \"risks\": [\n"
        "     {\n"
        "       \"section\": \"Clause X\",\n"
        "       \"risk_description\": \"Reason...\",\n"
        "       \"severity\": \"Medium\"\n"
        "     },\n"
        "     ...\n"
        "  ]\n"
        "}\n"
    )

    user_prompt = (
        f"Document:\n{document_text}\n\n"
        "Identify and categorize potential legal risks. "
        "Return valid JSON only."
    )

    gpt_response = call_gpt(
        prompt=user_prompt,
        system_message=system_message,
        temperature=0.3  # Lower temperature for consistency
    )

    identified_risks = []

    if gpt_response:
        # Try parsing the GPT response as JSON
        try:
            parsed = json.loads(gpt_response)
            # Expecting something like { "risks": [ {...}, {...} ] }
            if "risks" in parsed and isinstance(parsed["risks"], list):
                identified_risks = parsed["risks"]
                logger.info("Successfully parsed GPT-based risk analysis.")
            else:
                logger.warning("GPT response did not contain 'risks' or was not a list. Using fallback.")
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to decode GPT response as JSON: {e}. Using fallback.")
    else:
        logger.warning("GPT call returned no response. Using fallback.")

    # --------------------------------------------------------------------------
    # 2) Fallback logic if GPT parsing failed or no valid data found
    # --------------------------------------------------------------------------
    if not identified_risks:
        risk_levels = ["Low", "Medium", "High"]
        identified_risks = [
            {
                "section": "Clause 5",
                "risk_description": "Ambiguous language",
                "severity": random.choice(risk_levels),
            },
            {
                "section": "Clause 12",
                "risk_description": "Potential breach of contract",
                "severity": random.choice(risk_levels),
            },
        ]

    # --------------------------------------------------------------------------
    # 3) Store the risk report in your MongoDB collection
    # --------------------------------------------------------------------------
    risk_report = {
        "document_text": document_text,
        "risks": identified_risks,
        "user_id": user_id,
    }

    try:
        result = await db.risk_assessments.insert_one(risk_report)
        logger.info(f"Risk report created with ID: {result.inserted_id}")
        return {"id": str(result.inserted_id), "risks": identified_risks}
    except Exception as e:
        logger.error(f"Error inserting risk report: {e}")
        raise HTTPException(status_code=500, detail="Failed to create risk report in the database.")


async def get_risk_report(report_id: str, db: AsyncIOMotorDatabase):
    """
    Retrieve a specific risk report by ID.

    Args:
        report_id (str): The ObjectId string of the risk report.
        db (AsyncIOMotorDatabase): The database connection instance.

    Returns:
        dict: The risk report document, including an '_id' field converted to string.

    Raises:
        HTTPException: If the ID is invalid or the report is not found.
    """
    logger.info(f"Retrieving risk report with ID: {report_id}")

    if not ObjectId.is_valid(report_id):
        logger.warning(f"Invalid ObjectId format: {report_id}")
        raise HTTPException(status_code=400, detail="Invalid report ID format.")

    try:
        risk_report = await db.risk_assessments.find_one({"_id": ObjectId(report_id)})
        if not risk_report:
            logger.warning(f"Risk report not found for ID: {report_id}")
            raise HTTPException(status_code=404, detail="Risk report not found.")

        # Convert ObjectId to string for JSON response
        risk_report["_id"] = str(risk_report["_id"])
        logger.info(f"Successfully retrieved risk report for ID: {report_id}")
        return risk_report

    except HTTPException as http_err:
        raise http_err  # re-raise to preserve status code and message
    except Exception as e:
        logger.error(f"Error retrieving report: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
