import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field
from typing import Optional, Union, Dict
from bson import ObjectId
from datetime import datetime
from app.mvc.controllers.rephrase import run_rephrase_tool
from app.utils.security import get_current_user
from app.mvc.models.user import UserInDB

router = APIRouter(tags=["Rephrase"])
logger = logging.getLogger(__name__)


class RephraseRequest(BaseModel):
    document_text: Optional[str] = Field(
        None, description="Text to rephrase (if doc_id not provided)"
    )
    doc_id: Optional[str] = Field(
        None, description="Document ID to rephrase (if document_text not provided)"
    )
    style: str = Field(..., description="Rephrasing style (formal, clear, etc.)")


class RephraseTextResponse(BaseModel):
    report_id: str
    rephrased_text: str
    changes: list[Dict[str, str]]


class RephraseDocumentResponse(BaseModel):
    report_id: str
    rephrased_doc_id: str
    rephrased_doc_filename: str
    changes: list[Dict[str, str]]


@router.post("/", response_model=Union[RephraseTextResponse, RephraseDocumentResponse])
async def rephrase_handler(
    request_body: RephraseRequest,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    user_id = current_user.email
    db = request.app.state.db
    try:
        result = await run_rephrase_tool(
            db,
            user_id=user_id,
            style=request_body.style,
            document_text=request_body.document_text,
            doc_id=request_body.doc_id,
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Rephrase handler error", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
 
 # ───────────────────────────────────────────────────────────────
 # NEW:   GET  /rephrase/history    – list only **this** user’s reports
 #        DELETE /rephrase/{id}     – delete a report   GridFS doc (if any)
 # ───────────────────────────────────────────────────────────────
 
@router.get("/history")
async def get_history(
     request: Request,
     current_user: UserInDB = Depends(get_current_user),
 ):
     db = request.app.state.db
     cursor = db.rephrase_reports.find(
         {"user_id": current_user.email}
     ).sort("created_at", -1)
     items = []
     async for r in cursor:
         items.append({
             "id": str(r["_id"]),
             "style": r["style"],
             "created_at": r.get("created_at", datetime.utcnow()),
             "type": "doc" if r["rephrased_doc_id"] else "text",
             "filename": r.get("rephrased_output_summary", ""),
             "result_doc_id": r.get("rephrased_doc_id"),
             "result_text": (
                 r["rephrased_output_summary"] if not r["rephrased_doc_id"] else None
             ),
         })
     return {"history": items}
 
 
@router.delete("/{report_id}")
async def delete_report(
     report_id: str,
     request: Request,
     current_user: UserInDB = Depends(get_current_user),
 ):
     db = request.app.state.db
     row = await db.rephrase_reports.find_one({"_id": ObjectId(report_id)})
     if not row or row["user_id"] != current_user.email:
         raise HTTPException(status_code=404, detail="Not found")
 
     # if the result is a DOCX stored in GridFS, delete it, too
     if row.get("rephrased_doc_id"):
         await db.fs.files.delete_one({"_id": ObjectId(row["rephrased_doc_id"])})
 
     await db.rephrase_reports.delete_one({"_id": ObjectId(report_id)})
     return {"ok": True}