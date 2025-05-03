# backend/app/mvc/models/compliance.py

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import datetime

# Assuming you have a base model for documents if needed, but not strictly necessary for these models

class ComplianceIssue(BaseModel):
    """Represents a single compliance issue found in a document."""
    rule_id: str = Field(..., description="Identifier for the compliance rule.")
    description: str = Field(..., description="Detailed description of the issue and recommendation.")
    status: str = Field(..., description="Status of the issue (e.g., 'Issue Found', 'OK', 'Warning').")
    # Add the new field for the extracted text snippet
    extracted_text_snippet: Optional[str] = Field(None, description="Relevant text snippet from the document.")
    # You could add 'location: Optional[str]' if your analysis provides specific locations (e.g., page number, paragraph).


class ComplianceReportResponse(BaseModel):
    """Represents the summary of a compliance check report returned to the frontend."""
    report_id: str = Field(..., description="Unique identifier for the compliance report.")
    issues: List[ComplianceIssue] = Field(..., description="List of compliance issues found.")
    # Add other summary fields if needed in the API response


class ComplianceReport(BaseModel):
    """Represents the full compliance report stored in the database."""
    user_id: str = Field(..., description="ID of the user who generated the report.")
    document_text_preview: Optional[str] = Field(None, description="A preview of the analyzed text.")
    original_doc_id: Optional[str] = Field(None, description="The ID of the original document if applicable.")
    issues: List[ComplianceIssue] = Field(..., description="List of compliance issues found.")
    timestamp: datetime.datetime = Field(..., description="Timestamp when the report was generated (UTC).")
    # Add any other metadata you want to store with the report