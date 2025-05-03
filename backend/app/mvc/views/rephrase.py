# backend/app/mvc/views/rephrase.py

import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field
from typing import Optional, Union, Dict, Any # Import Dict and Any for logging the result

from app.mvc.controllers.rephrase import run_rephrase_tool # We'll update this controller function
from app.utils.security import get_current_user
from app.mvc.models.user import UserInDB

router = APIRouter(tags=["Rephrase"])
logger = logging.getLogger(__name__)

class RephraseRequest(BaseModel):
    # Allow either document_text OR doc_id, but not both, and require style
    document_text: Optional[str] = Field(None, description="Text content to rephrase. Required if doc_id is not provided.")
    doc_id: Optional[str] = Field(None, description="ID of the document to rephrase. Required if document_text is not provided.")
    style: str = Field(..., description="Rephrasing style (e.g., formal, clear).")

    # Add a validator to ensure either document_text or doc_id is provided, but not both
    # Note: In Pydantic v2+, __validator_before_instantiation__ is deprecated.
    # Use model_validator(mode='before') or field_validator instead.
    # For compatibility with potentially older versions or simplicity,
    # we can keep this for now or rely on the controller's check.
    # A more modern Pydantic v2 approach would be:
    # from pydantic import model_validator
    # @model_validator(mode='before')
    # def check_either_text_or_doc_id(cls, data):
    #     if (data.get('document_text') is None) == (data.get('doc_id') is None):
    #          raise ValueError("Exactly one of 'document_text' or 'doc_id' must be provided.")
    #     return data
    # Sticking to the controller check for now to minimize changes in the view logic flow.


class RephraseTextResponse(BaseModel):
    # Response structure for text rephrasing
    report_id: str
    rephrased_text: str

class RephraseDocumentResponse(BaseModel):
    # Response structure for document rephrasing
    report_id: str # ID of the rephrase report record
    rephrased_doc_id: str # ID of the NEW rephrased document in the documents collection
    rephrased_doc_filename: str # Filename of the NEW rephrased document

@router.post("/")
async def rephrase_handler(
    request_body: RephraseRequest,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
) -> Union[RephraseTextResponse, RephraseDocumentResponse]: # Indicate possible return types
    """
    Rephrase text content or an entire document for clarity with a specified style.
    If document_text is provided, returns {"report_id", "rephrased_text"}.
    If doc_id is provided, returns {"report_id", "rephrased_doc_id", "rephrased_doc_filename"}.
    """
    user_id = current_user.email
    db = request.app.state.db
    style = request_body.style

    try:
        if request_body.document_text is not None:
            # Handle text rephrasing
            result: Dict[str, Any] = await run_rephrase_tool(db, document_text=request_body.document_text, user_id=user_id, style=style)
            logger.info(f"Returning text rephrase result: {result}") # Log the result
            # Return the dictionary directly, FastAPI will serialize based on type hint
            return result # Should match RephraseTextResponse structure
        elif request_body.doc_id is not None:
            # Handle document rephrasing
            result: Dict[str, Any] = await run_rephrase_tool(db, doc_id=request_body.doc_id, user_id=user_id, style=style)
            logger.info(f"Returning document rephrase result: {result}") # Log the result
            # Return the dictionary directly, FastAPI will serialize based on type hint
            return result # Should match RephraseDocumentResponse structure

    except HTTPException:
        raise # Re-raise FastAPI exceptions
    except Exception as e:
        logger.error(f"Rephrase error in view: {e}", exc_info=True) # Added context to log
        raise HTTPException(status_code=500, detail="Internal server error")

# Keep the GET endpoint for fetching rephrase reports if needed.
# @router.get("/{report_id}")
# async def fetch_rephrase_report(...):
#    ...