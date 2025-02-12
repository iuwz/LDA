import logging
import json
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

# Import GPT helper
from app.core.openai_client import call_gpt

logger = logging.getLogger(__name__)

# Original example mock rules
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
    Attempts a GPT-based compliance check. If GPT fails or returns invalid JSON,
    falls back to scanning known patterns from MOCK_RULES.

    Stores the final issues in 'compliance_reports' collection and returns:
      {
        "report_id": <str>,
        "issues": <list of issues>
      }
    """
    if not document_text:
        raise HTTPException(status_code=400, detail="Document text is required")

    logger.info(f"Running compliance check for user_id={user_id}")

    # 1) Attempt GPT-based analysis
    system_message = (
        "You are a compliance AI assistant. Identify any issues or potential "
        "violations in the given document. Return valid JSON with a top-level "
        "key 'issues' that is a list of objects. Each object should have "
        "'rule_id', 'description', and 'status' fields. Use rule_id='GPT'."
    )
    user_prompt = (
        f"Document:\n{document_text}\n\n"
        "Return valid JSON ONLY, e.g.: "
        "{"
        "  \"issues\": ["
        "    {"
        "      \"rule_id\": \"GPT\","
        "      \"description\": \"Issue description\","
        "      \"status\": \"Issue Found\""
        "    }"
        "  ]"
        "}"
    )

    gpt_response = call_gpt(
        prompt=user_prompt,
        system_message=system_message,
        temperature=0.2
    )

    gpt_issues = []
    if gpt_response:
        try:
            parsed = json.loads(gpt_response)
            if "issues" in parsed and isinstance(parsed["issues"], list):
                # GPT returned the expected structure
                gpt_issues = parsed["issues"]
                logger.info("GPT compliance analysis parsed successfully.")
            else:
                logger.warning("GPT response did not contain 'issues' as a list. Using fallback.")
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse GPT response as JSON: {e}. Using fallback.")
    else:
        logger.warning("GPT call returned no response. Using fallback.")

    # 2) If GPT results are empty or invalid, use the original mock logic
    if not gpt_issues:
        logger.info("Performing mock rule-based compliance check instead.")
        found_issues = []
        for rule in MOCK_RULES:
            if rule["pattern"].lower() in document_text.lower():
                found_issues.append({
                    "rule_id": rule["rule_id"],
                    "description": rule["description"],
                    "status": "Issue Found"
                })

        # If no issues found, store a "no issues" record
        if not found_issues:
            found_issues.append({
                "rule_id": "None",
                "description": "No compliance issues detected",
                "status": "OK"
            })

        final_issues = found_issues
    else:
        # GPT returned a valid list of issues
        final_issues = gpt_issues

    # 3) Insert the compliance report into MongoDB
    compliance_doc = {
        "user_id": user_id,
        "document_text": document_text,
        "issues": final_issues
    }
    result = await db.compliance_reports.insert_one(compliance_doc)
    logger.info(f"Compliance report created with _id={result.inserted_id}")

    return {
        "report_id": str(result.inserted_id),
        "issues": final_issues
    }

async def get_compliance_report(
    db: AsyncIOMotorDatabase,
    report_id: str,
    user_id: str
):
    """
    Retrieve a compliance report by ID and verify it belongs to the user.

    Returns the report document (with '_id' converted to string) if valid;
    otherwise raises HTTPException (400, 403, or 404).
    """
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=400, detail="Invalid report ID format")

    doc = await db.compliance_reports.find_one({"_id": ObjectId(report_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Compliance report not found")

    # Verify ownership
    if doc["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied (not your report)")

    doc["_id"] = str(doc["_id"])
    return doc
