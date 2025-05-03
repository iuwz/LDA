# backend/app/mvc/controllers/compliance.py

import logging
import json
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import List, Dict, Any, Optional
import datetime
import re
from io import BytesIO

# Import python-docx library components
from docx import Document
from docx.shared import Inches
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT

# Import document controllers/helpers including the text extraction
from app.mvc.controllers.documents import get_document_record, open_gridfs_file, extract_full_text_from_stream

# Import compliance models
from app.mvc.models.compliance import ComplianceIssue, ComplianceReport

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
    # Add more mock rules as needed for testing fallback
    {
        "rule_id": "R3",
        "pattern": "Jurisdiction",
        "description": "Ensure governing law and jurisdiction clauses are present"
    }
]

# Helper to extract a text snippet around a matched pattern
def extract_snippet(text: str, pattern: str, window_size: int = 50) -> str:
    """
    Finds the first occurrence of a pattern (case-insensitive) in the text
    and returns a snippet around it.
    """
    # Escape pattern for regex special characters
    escaped_pattern = re.escape(pattern)
    # Build regex to find the pattern
    match = re.search(escaped_pattern, text, re.IGNORECASE)
    if not match:
        return f"Pattern '{pattern}' not found in text."

    start, end = match.span()

    # Determine snippet boundaries
    snippet_start = max(0, start - window_size)
    snippet_end = min(len(text), end + window_size)

    # Extract snippet
    snippet = text[snippet_start:snippet_end]

    # Add ellipses if snippet is truncated
    if snippet_start > 0:
        snippet = "..." + snippet
    if snippet_end < len(text):
        snippet = snippet + "..."

    return snippet

async def run_compliance_check(
    db: AsyncIOMotorDatabase,
    user_id: str,
    document_text: str = None, # Make text optional
    doc_id: str = None # Add doc_id as optional
) -> Dict[str, Any]: # Use Dict[str, Any] as return type hint for flexibility

    """
    Performs a compliance check on the given document text or the text from a document ID.
    If document_text is provided, checks text directly.
    If doc_id is provided, fetches and extracts text from the document for analysis.

    Uses GPT for analysis if possible, falls back to scanning known patterns.

    Stores the final issues in 'compliance_reports' collection and returns:
      {
        "report_id": <str>,
        "issues": <list of issues>
      }
    Raises HTTPException on failure.
    """

    if document_text is None and doc_id is None:
        raise HTTPException(status_code=400, detail="Either document_text or doc_id must be provided.")
    if document_text is not None and doc_id is not None:
         raise HTTPException(status_code=400, detail="Only one of document_text or doc_id should be provided.")


    logger.info(f"Starting compliance check for user_id={user_id}")

    original_doc_id = doc_id # Store original doc_id for the report

    # 1. Get the document text to analyze
    text_to_analyze = ""
    if doc_id:
        logger.info(f"Fetching text from document ID: {doc_id}")
        try:
            record = await get_document_record(db, doc_id)
            grid_out, filename = await open_gridfs_file(db, record["file_id"])
            text_to_analyze = await extract_full_text_from_stream(grid_out, filename)

            if text_to_analyze.startswith("Error"): # Check for error messages from text extraction
                 logger.error(f"Text extraction failed for doc_id {doc_id}: {text_to_analyze}")
                 raise HTTPException(status_code=422, detail=f"Failed to extract text from document: {text_to_analyze}")

            logger.info(f"Successfully extracted text from document ID: {doc_id}")

        except HTTPException:
             raise # Re-raise FastAPI exceptions
        except Exception as e:
             logger.error(f"An error occurred fetching or extracting text for doc_id {doc_id}: {e}", exc_info=True)
             raise HTTPException(status_code=500, detail=f"Failed to process document for compliance check: {e}")

    elif document_text:
        text_to_analyze = document_text
        logger.info("Using provided document text for compliance check.")


    if not text_to_analyze:
         raise HTTPException(status_code=400, detail="No text available to perform compliance check.")


    # 2. Attempt GPT-based analysis
    # Updated prompt to ask for text snippet
    system_message = (
        "You are a compliance AI assistant. Identify any issues or potential "
        "violations in the given document text. Focus on legal and regulatory compliance aspects relevant to Saudi Arabia."
        "Return valid JSON with a top-level key 'issues' that is a list of objects. Each object should have "
        "'rule_id', 'description', 'status' fields. Use rule_id='GPT' for issues identified by AI."
        "If no issues are found, return an empty list for the 'issues' key."
        "**IMPORTANT:** For each issue identified, include a field `extracted_text_snippet` containing the exact or approximate text snippet from the document that is most relevant to the issue. Provide a snippet of reasonable length (e.g., a sentence or two). If you cannot pinpoint a specific snippet, set this field to `null`."
        "Example of expected JSON format:\n"
        "{\n"
        "  \"issues\": [\n"
        "    {\n"
        "      \"rule_id\": \"GPT\",\n"
        "      \"description\": \"Issue description\",\n"
        "      \"status\": \"Issue Found\", // or \"Warning\"\n"
        "      \"extracted_text_snippet\": \"...text snippet from document...\" // or null\n"
        "    }\n"
        "  ]\n"
        "}"
        "Return valid JSON ONLY. Do not include any additional text or formatting outside the JSON."
    )
    user_prompt = f"Document text for compliance check:\n{text_to_analyze}"

    gpt_issues: List[Dict[str, Any]] = [] # Initialize as empty list with type hint and use Dict for flexibility
    use_gpt_fallback = True # Flag to control fallback logic

    try:
        logger.info("Calling GPT for compliance analysis...")
        # NOTE: For very long texts, you will need to implement chunking here,
        # send chunks to the AI, and combine the results. This is similar
        # to the rephrasing tool's document handling challenge.
        gpt_response = call_gpt(
            prompt=user_prompt,
            system_message=system_message,
            temperature=0.2 # Keep temperature low for factual analysis
        )

        if gpt_response:
            try:
                parsed = json.loads(gpt_response)
                # Validate the structure of the parsed response
                if "issues" in parsed and isinstance(parsed["issues"], list):
                    # Validate each item in the issues list against ComplianceIssue model
                    validated_issues = []
                    for issue_data in parsed["issues"]:
                         try:
                             # Attempt to validate using the Pydantic model (will now include snippet)
                             validated_issue = ComplianceIssue(**issue_data)
                             # Use model_dump() for Pydantic v2+ to get a dictionary
                             validated_issues.append(validated_issue.model_dump())
                         except Exception as model_error:
                              logger.warning(f"Failed to validate GPT issue format: {issue_data}. Error: {model_error}. Skipping issue.")
                              # Optionally, add a general warning issue about unexpected AI output format
                              # validated_issues.append({"rule_id": "GPT-Format-Warning", "description": f"AI returned issue in unexpected format: {issue_data}", "status": "Warning", "extracted_text_snippet": None})

                    gpt_issues = validated_issues
                    logger.info(f"GPT compliance analysis parsed successfully. Found {len(gpt_issues)} potential issues.")
                    use_gpt_fallback = False # GPT analysis was successful and usable

                else:
                    logger.warning("GPT response did not contain 'issues' as a list or top-level key. Using fallback.")
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse GPT response as JSON: {e}. Using fallback.")
            except Exception as e: # Catch other parsing/validation errors
                 logger.error(f"Error processing GPT response structure: {e}", exc_info=True)
                 logger.warning("Error processing GPT response structure. Using fallback.")
        else:
            logger.warning("GPT call returned no response. Using fallback.")

    except Exception as e:
         logger.error(f"Error calling GPT for compliance analysis: {e}", exc_info=True)
         logger.warning("GPT call failed. Using fallback logic.")


    # 3. Determine final issues list (GPT results or fallback)
    final_issues: List[Dict[str, Any]] = []
    if use_gpt_fallback or not gpt_issues: # Use fallback if flag is true OR if GPT issues list is empty
        logger.info("Performing mock rule-based compliance check as fallback.")
        found_issues = []
        for rule in MOCK_RULES:
            # Perform simple case-insensitive pattern match
            if text_to_analyze and rule["pattern"].lower() in text_to_analyze.lower():
                # Extract snippet for mock rules
                snippet = extract_snippet(text_to_analyze, rule["pattern"])
                found_issues.append({
                    "rule_id": rule["rule_id"],
                    "description": rule["description"],
                    "status": "Issue Found", # Mock rules just mark as "Issue Found"
                    "extracted_text_snippet": snippet # Include the snippet
                })

        # If no issues found by fallback, add a "no issues" record
        if not found_issues:
            found_issues.append({
                "rule_id": "None",
                "description": "No compliance issues detected by basic scan.",
                "status": "OK",
                "extracted_text_snippet": None # No snippet for OK status
            })

        final_issues = found_issues
    else:
        # GPT returned a valid list of issues, use them
        # Note: Snippets for GPT issues rely on the AI successfully providing them
        # in the `extracted_text_snippet` field as requested in the prompt.
        final_issues = gpt_issues


    # 4. Insert the compliance report into MongoDB
    compliance_doc = {
        "user_id": user_id,
        # Store a preview of the text, especially for document checks
        "document_text_preview": text_to_analyze[:500] + "..." if text_to_analyze and len(text_to_analyze) > 500 else text_to_analyze,
        "original_doc_id": original_doc_id, # Store the doc ID if applicable
        "issues": final_issues, # Store the final list of issues (including snippets)
        "timestamp": datetime.datetime.utcnow() # Add a timestamp
    }


    try:
        result = await db.compliance_reports.insert_one(compliance_doc)
        report_id = str(result.inserted_id)
        logger.info(f"Compliance report created with _id={report_id}")
    except Exception as e:
        logger.error(f"Error inserting compliance report: {e}", exc_info=True)
        # If report storage fails, raise an error as the result cannot be retrieved later
        raise HTTPException(status_code=500, detail="Failed to store compliance report.")


    # 5. Return the report ID and issues for the frontend
    return {
        "report_id": report_id,
        "issues": final_issues # Return the final list of issues (including snippets)
    }

async def get_compliance_report(
    db: AsyncIOMotorDatabase,
    report_id: str,
    user_id: str
) -> Dict[str, Any]: # Return Dict[str, Any] for consistency

    """
    Retrieve a compliance report by ID and verify it belongs to the user.

    Returns the report document (with '_id' converted to string) if valid;
    otherwise raises HTTPException (400, 403, or 404).
    """
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=400, detail="Invalid report ID format")

    # Find the report, ensure it belongs to the user
    doc = await db.compliance_reports.find_one({"_id": ObjectId(report_id), "user_id": user_id})
    if not doc:
        # Check if report exists but belongs to someone else for a more specific error
        exists_but_not_owned = await db.compliance_reports.find_one({"_id": ObjectId(report_id)})
        if exists_but_not_owned:
            raise HTTPException(status_code=403, detail="Access denied (not your report)")
        else:
            raise HTTPException(status_code=404, detail="Compliance report not found")


    # Convert ObjectId to string before returning
    doc["_id"] = str(doc["_id"])
    # Ensure nested ObjectIds (like in issues if any were stored) are also converted if needed
    # In our current ComplianceIssue model, there are no ObjectIds, but good practice to consider.

    return doc

# Function to generate text report (kept for reference or other uses)
def generate_compliance_report_text(report_data: Dict[str, Any]) -> str:
    """
    Formats a compliance report dictionary into a plain text string for download.
    """
    report_id = report_data.get("_id", "N/A") # Use _id from fetched doc
    timestamp = report_data.get("timestamp")
    user_id = report_data.get("user_id", "N/A")
    original_doc_id = report_data.get("original_doc_id", "N/A")
    issues = report_data.get("issues", [])
    document_text_preview = report_data.get("document_text_preview", "N/A")

    report_text = f"Compliance Report ID: {report_id}\n"
    report_text += f"Generated At: {timestamp.strftime('%Y-%m-%d %H:%M:%S UTC') if timestamp else 'N/A'}\n"
    report_text += f"User: {user_id}\n"
    report_text += f"Original Document ID: {original_doc_id}\n"
    report_text += "-"*30 + "\n"
    report_text += "Analysis Summary:\n"
    report_text += "-"*30 + "\n"

    if issues:
        for i, issue in enumerate(issues):
            report_text += f"Issue {i+1}:\n"
            report_text += f"  Rule ID: {issue.get('rule_id', 'N/A')}\n"
            report_text += f"  Status: {issue.get('status', 'N/A')}\n"
            report_text += f"  Description: {issue.get('description', 'N/A')}\n"
            # Include the extracted text snippet in the text report if it exists
            snippet = issue.get('extracted_text_snippet')
            if snippet:
                report_text += f"  Relevant Text: \"{snippet}\"\n"

            # Add location if available and relevant
            # location = issue.get('location')
            # if location:
            #     report_text += f"  Location: {location}\n"
            report_text += "-"*10 + "\n"
    else:
        report_text += "No issues reported.\n"

    report_text += "\n" + "="*30 + "\n"
    report_text += "Document Text Preview:\n"
    report_text += "="*30 + "\n"
    report_text += document_text_preview
    report_text += "\n" + "="*30 + "\n"
    report_text += "End of Report\n"

    return report_text


# --- DOCX Generation Logic using python-docx ---
def generate_compliance_report_docx(report_data: Dict[str, Any]) -> Optional[BytesIO]:
    """
    Generates a DOCX report from compliance report data using python-docx.
    Returns a BytesIO buffer containing the DOCX content on success, or None on failure.
    """
    logger.info(f"Attempting to generate DOCX for report ID: {report_data.get('_id')}")

    buffer = BytesIO()
    document = Document() # Create a new Word document

    try:
        # --- Report Title ---
        document.add_heading('Compliance Report', 0) # Level 0 is main title

        # --- Report Information ---
        report_id = report_data.get("_id", "N/A")
        timestamp = report_data.get("timestamp")
        user_id = report_data.get("user_id", "N/A")
        analyzed_filename = report_data.get("analyzedFilename", "N/A") # Assuming this might be available

        document.add_paragraph(f"Report ID: {report_id}")
        document.add_paragraph(f"Generated At: {timestamp.strftime('%Y-%m-%d %H:%M:%S UTC') if timestamp else 'N/A'}")
        document.add_paragraph(f"User: {user_id}")

        if analyzed_filename and analyzed_filename != "N/A":
             document.add_paragraph(f"Analyzed Document: {analyzed_filename}")
        elif report_data.get("original_doc_id"):
             document.add_paragraph(f"Original Document ID: {report_data.get('original_doc_id', 'N/A')}")


        document.add_paragraph() # Add some space

        # --- Issues Section ---
        document.add_heading('Issues Found:', level=1)
        document.add_paragraph() # Add some space

        issues = report_data.get("issues", [])
        if not issues:
            document.add_paragraph("No issues reported.").italic = True
        else:
            # Add issues as paragraphs
            for i, issue in enumerate(issues):
                document.add_paragraph(f"Issue {i+1}:", style='Heading 2') # Use a heading style for each issue

                document.add_paragraph(f"Rule ID: {issue.get('rule_id', 'N/A')}")
                document.add_paragraph(f"Status: {issue.get('status', 'N/A')}")

                # Add description
                description_para = document.add_paragraph("Description: ")
                description_para.add_run(issue.get('description', 'N/A'))

                # Add snippet if available
                snippet = issue.get('extracted_text_snippet')
                if snippet:
                    snippet_para = document.add_paragraph("Relevant Text: ")
                    # Add run with quotes and italic style
                    snippet_para.add_run(f'"{snippet}"').italic = True

                document.add_paragraph() # Space after each issue


        # --- Optional: Document Text Preview ---
        document_text_preview = report_data.get("document_text_preview", "N/A")
        if document_text_preview and document_text_preview != "N/A":
            document.add_heading('Document Text Preview:', level=1)
            document.add_paragraph()
            document.add_paragraph(document_text_preview) # Add preview text

        # Save the document to the BytesIO buffer
        document.save(buffer)
        buffer.seek(0) # Rewind the buffer

        return buffer # Return the buffer on success

    except Exception as e:
        logger.error(f"Error generating DOCX for report ID {report_data.get('_id')}: {e}", exc_info=True)
        # Return None if generation fails
        return None