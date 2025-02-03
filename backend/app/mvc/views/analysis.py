from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.mvc.controllers.analysis import analyze_risk
from bson.objectid import ObjectId

router = APIRouter()

class RiskAnalysisRequest(BaseModel):
    document_text: str

@router.post("/risk")
async def analyze_risk_endpoint(request: RiskAnalysisRequest, req: Request):
    """API endpoint to analyze legal document risk."""
    db = req.app.state.db  # Access the database
    try:
        result = await analyze_risk(request.document_text, db)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/risk/{report_id}")
async def get_risk_report_endpoint(report_id: str, req: Request):
    """API endpoint to retrieve a risk report by ID."""
    db = req.app.state.db  # Access the database
    try:
        result = await get_risk_report(report_id, db)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")