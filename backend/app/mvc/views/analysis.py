import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.mvc.controllers.analysis import analyze_risk, get_risk_report
from bson.objectid import ObjectId

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Request schema for risk analysis
class RiskAnalysisRequest(BaseModel):
    document_text: str

@router.post("/risk")
async def analyze_risk_endpoint(request: RiskAnalysisRequest, req: Request):
    """API endpoint to analyze legal document risk."""
    db = req.app.state.db  # Access the database
    user_id = req.state.user_id  # Extract the user ID from request state

    logger.info(f"Analyzing risk for user_id: {user_id}")

    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        # Log document text
        logger.info(f"Document text: {request.document_text}")

        # Call the controller function to analyze risk
        result = await analyze_risk(request.document_text, user_id, db)
        return result
    except HTTPException as e:
        logger.error(f"HTTPException: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Internal server error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/risk")
async def list_user_risk_reports(req: Request):
    """API endpoint to list all risk reports for the logged-in user."""
    db = req.app.state.db  # Access the database

    user_id = req.state.user_id  # Extract user ID
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        # Query the database for all reports associated with the user
        reports = []
        async for report in db.risk_assessments.find({"user_id": user_id}):
            report["_id"] = str(report["_id"])  # Convert ObjectId to string
            reports.append(report)

        logger.info(f"Returning {len(reports)} reports for user_id {user_id}")
        return reports

    except Exception as e:
        logger.error(f"Error listing risk reports for user_id {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/risk/{report_id}")
async def get_risk_report_endpoint(report_id: str, req: Request):
    """API endpoint to retrieve a risk report by ID. Only accessible by the user who submitted the document."""
    db = req.app.state.db  # Access the database
    user_id = req.state.user_id  # Extract the user ID from the request state
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        # Retrieve the risk report
        result = await get_risk_report(report_id, db)

        # Check if the report belongs to the current user
        if result.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied. This report does not belong to you.")

        return result

    except HTTPException as e:
        logger.error(f"HTTPException while retrieving report: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Internal server error while retrieving report: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
