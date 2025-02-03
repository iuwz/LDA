from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException
import random

async def analyze_risk(document_text: str, db: AsyncIOMotorDatabase):
    """Analyzes the legal document and evaluates its risk level."""
    if not document_text:
        raise HTTPException(status_code=400, detail="Document text is required for analysis")

    # Mock risk assessment logic (replace with ML model)
    risk_levels = ["Low", "Medium", "High"]
    identified_risks = [
        {"section": "Clause 5", "risk": "Ambiguous language", "severity": random.choice(risk_levels)},
        {"section": "Clause 12", "risk": "Potential breach of contract", "severity": random.choice(risk_levels)}
    ]

    # Store results in MongoDB
    risk_report = {
        "document_text": document_text,
        "risks": identified_risks
    }
    result = await db.risk_assessments.insert_one(risk_report)

    return {"id": str(result.inserted_id), "risks": identified_risks}

async def get_risk_report(report_id: str, db: AsyncIOMotorDatabase):
    """Retrieve a specific risk report by ID."""
    try:
        risk_report = await db.risk_assessments.find_one({"_id": ObjectId(report_id)})
        if not risk_report:
            raise HTTPException(status_code=404, detail="Risk report not found")
        risk_report["_id"] = str(risk_report["_id"])  # Convert ObjectId to string
        return risk_report
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid ID format")