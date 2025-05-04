from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Change(BaseModel):
    original: str
    revised: str

class RephraseReport(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    style: str
    original_content_info: str
    rephrased_output_summary: str
    original_doc_id: Optional[str]
    rephrased_doc_id: Optional[str]
    changes: List[Change]
    created_at: datetime = Field(default_factory=datetime.utcnow)
