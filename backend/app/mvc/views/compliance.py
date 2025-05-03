# backend/app/mvc/views/compliance.py

import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field
from typing import Optional, Union
from fastapi.responses import StreamingResponse, Response
from io import BytesIO
from urllib.parse import quote

# Import compliance controller functions including the DOCX generator
# FIX: Import generate_compliance_report_docx
from app.mvc.controllers.compliance import run_compliance_check, get_compliance_report, generate_compliance_report_text, generate_compliance_report_docx # <-- Import generate_compliance_report_docx

from app.utils.security import get_current_user
from app.mvc.models.user import UserInDB
# Import compliance models for response validation (optional but good practice)
from app.mvc.models.compliance import ComplianceReportResponse, ComplianceReport


router = APIRouter(tags=["Compliance"])
logger = logging.getLogger(__name__)

class ComplianceRequest(BaseModel):
    # Allow either document_text OR doc_id, but not both
    document_text: Optional[str] = Field(None, description="Text content to check. Required if doc_id is not provided.")
    doc_id: Optional[str] = Field(None, description="ID of the document to check. Required if document_text is not provided.")

    # Optional: Add a validator if you want Pydantic to enforce the either/or rule
    # This can be done using model_validator in Pydantic v2+ or root_validator in v1.
    # For now, we rely on the controller's check for simplicity.


@router.post("/check", response_model=ComplianceReportResponse)
async def check_compliance(
    request_body: ComplianceRequest,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Run a compliance check on text or a document. Returns {"report_id", "issues": [...]}.
    """
    user_id = current_user.email
    db = request.app.state.db

    try:
        # Pass either document_text or doc_id to the controller
        if request_body.document_text is not None:
             logger.info(f"Received compliance check request for text for user {user_id}")
             result = await run_compliance_check(
                db=db,
                document_text=request_body.document_text,
                user_id=user_id
             )
        elif request_body.doc_id is not None:
             logger.info(f"Received compliance check request for document ID {request_body.doc_id} for user {user_id}")
             result = await run_compliance_check(
                db=db,
                doc_id=request_body.doc_id,
                user_id=user_id
             )
        else:
             # This case should theoretically be caught by the controller's validation,
             # but as a safeguard.
             raise HTTPException(status_code=400, detail="Either document_text or doc_id must be provided.")


        # The controller returns a dictionary that matches ComplianceReportResponse structure
        logger.info(f"Compliance check completed, returning report ID: {result.get('report_id')}")
        return result # FastAPI will serialize this dictionary based on the response_model


    except HTTPException:
        raise # Re-raise FastAPI exceptions
    except Exception as e:
        logger.error(f"Compliance check error in view: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error during compliance check: {e}")


@router.get("/report/download/{report_id}", response_class=Response)
async def download_compliance_report(
    report_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Retrieve a compliance report by ID and return it as a downloadable DOCX file.
    Only accessible by its creator.
    """
    user_id = current_user.email
    db = request.app.state.db

    try:
        # Fetch the full report data from the database using the controller function
        # The controller already checks for user ownership
        report_data_dict = await get_compliance_report(
            db=db,
            report_id=report_id,
            user_id=user_id
        )

        # --- Call the DOCX generation function ---
        # FIX: Call the new DOCX generation function
        docx_buffer = generate_compliance_report_docx(report_data_dict)

        # Check if docx_buffer is None before trying to use it
        if docx_buffer is None:
            logger.error(f"DOCX generation failed for report ID: {report_id}")
            raise HTTPException(status_code=500, detail="Failed to generate DOCX report.")


        # Set headers for download
        # FIX: Change filename extension to .docx and Content-Type for DOCX
        filename = f"compliance_report_{report_id}.docx"
        # Use urllib.parse.quote to handle non-ASCII characters in filename for Content-Disposition
        disp_name = quote(filename)
        headers = {
            "Content-Disposition": f"attachment; filename*=UTF-8''{disp_name}",
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" # Mime type for .docx
        }

        # Return as a StreamingResponse
        # Read from the BytesIO buffer
        async def docx_iterator():
            # You can read in chunks from the buffer if needed,
            # but for a standard report DOCX, reading all at once is usually fine.
            docx_buffer.seek(0) # Ensure we are at the beginning of the buffer
            yield docx_buffer.getvalue() # Yield all content

        # FIX: Return StreamingResponse with updated headers and media_type
        return StreamingResponse(docx_iterator(), headers=headers, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")


    except HTTPException:
        raise # Re-raise FastAPI exceptions
    except Exception as e:
        logger.error(f"Error generating or downloading compliance report {report_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error generating report: {e}")


# Keep the GET endpoint for fetching compliance reports if needed for previewing JSON
# @router.get("/report/{report_id}") # This route path would conflict with the download route
# async def fetch_compliance_report(...):
#    ...