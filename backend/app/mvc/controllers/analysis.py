import logging
from bson.objectid import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException
import random

# Configure logging
logger = logging.getLogger(__name__)

async def analyze_risk(document_text: str, user_id: str, db: AsyncIOMotorDatabase):
    """
    Analyzes the legal document and evaluates its risk level.
    
    Args:
        document_text (str): The text of the legal document.
        user_id (str): The ID of the user who submitted the document.
        db: The database connection instance (AsyncIOMotorDatabase).

    Returns:
        dict: The analysis result containing identified risks.

    Raises:
        HTTPException: If the input document is invalid.
    """
    logger.info(f"Starting risk analysis for user_id: {user_id}")

    if not document_text:
        logger.warning("No document text provided for analysis")
        raise HTTPException(status_code=400, detail="Document text is required for analysis")

    # Mock risk assessment logic (replace with actual ML models later)
    risk_levels = ["Low", "Medium", "High"]
    identified_risks = [
        {"section": "Clause 5", "risk": "Ambiguous language", "severity": random.choice(risk_levels)},
        {"section": "Clause 12", "risk": "Potential breach of contract", "severity": random.choice(risk_levels)},
    ]

    # Store the analysis result in the database with the user_id
    risk_report = {
        "document_text": document_text,
        "risks": identified_risks,
        "user_id": user_id,  # Associate report with the user
    }
    
    result = await db.risk_assessments.insert_one(risk_report)

    # Log the generated report ID
    logger.info(f"Risk report created with ID: {result.inserted_id}")

    return {"id": str(result.inserted_id), "risks": identified_risks}

async def get_risk_report(report_id: str, db: AsyncIOMotorDatabase):
    """Retrieve a specific risk report by ID."""
    try:
        logger.info(f"Retrieving risk report with ID: {report_id}")

        # Validate ObjectId
        if not ObjectId.is_valid(report_id):
            logger.warning(f"Invalid ObjectId format: {report_id}")
            raise HTTPException(status_code=400, detail="Invalid report ID format")

        # Query the database
        risk_report = await db.risk_assessments.find_one({"_id": ObjectId(report_id)})
        if not risk_report:
            logger.warning(f"Risk report not found for ID: {report_id}")
            raise HTTPException(status_code=404, detail="Risk report not found")

        # Convert ObjectId to string for JSON response
        risk_report["_id"] = str(risk_report["_id"])

        logger.info(f"Successfully retrieved risk report for ID: {report_id}")
        return risk_report

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error retrieving report: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
