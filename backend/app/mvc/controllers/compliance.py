import logging
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

logger = logging.getLogger(__name__)

# Just some mock rules for illustration
MOCK_RULES = [
    {
        "rule_id": "R1",
        "pattern": "Confidential",
        "description": "Document marked confidential requires an NDA clause"
    },
    {
        "rule_id": "R2",
        "pattern": "Penalty",
        "description": "Check if penalty exceeds legal limit"
    },
]

async def run_compliance_check(
    db: AsyncIOMotorDatabase,
    document_text: str,
    user_id: str
):
    """
    Mock compliance check logic:
    - Scan for known patterns from MOCK_RULES
    - Build a list of 'issues'
    - Insert a record into the 'compliance_reports' collection
    - Return the generated report ID + issues
    """
    if not document_text:
        raise HTTPException(status_code=400, detail="Document text is required")

    logger.info(f"Running compliance check for user_id: {user_id}")

    found_issues = []
    for rule in MOCK_RULES:
        if rule["pattern"].lower() in document_text.lower():
            found_issues.append({
                "rule_id": rule["rule_id"],
                "description": rule["description"],
                "status": "Issue Found"
            })

    # If no issues found, let’s store a "no issues" record
    if not found_issues:
        found_issues.append({
            "rule_id": "None",
            "description": "No compliance issues detected",
            "status": "OK"
        })

    compliance_doc = {
        "user_id": user_id,
        "document_text": document_text,
        "issues": found_issues
    }

    result = await db.compliance_reports.insert_one(compliance_doc)
    logger.info(f"Compliance report created with _id={result.inserted_id}")

    return {
        "report_id": str(result.inserted_id),
        "issues": found_issues
    }

async def get_compliance_report(
    db: AsyncIOMotorDatabase,
    report_id: str,
    user_id: str
):
    """
    Retrieve a compliance report by ID and verify it belongs to the user.
    """
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=400, detail="Invalid report ID format")

    doc = await db.compliance_reports.find_one({"_id": ObjectId(report_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Compliance report not found")

    if doc["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied (not your report)")

    doc["_id"] = str(doc["_id"])
    return doc
