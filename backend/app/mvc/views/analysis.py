# backend/app/mvc/views/analysis.py
import logging
import mimetypes
from urllib.parse import quote

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request, Depends, UploadFile, File
from fastapi.responses import StreamingResponse

from pydantic import BaseModel

from backend.app.mvc.controllers.documents import (
    extract_full_text_from_stream,
    upload_file_to_gridfs,
    open_gridfs_file,           # <-- add this import
)
from backend.app.mvc.controllers.analysis import analyze_risk, get_risk_report
from backend.app.utils.security import get_current_user
from backend.app.mvc.models.user import UserInDB

router = APIRouter(tags=["Analysis"])

# ---------------------------------------------------------------------  models
class RiskAnalysisRequest(BaseModel):
    document_text: str

# ---------------------------------------------------------------------  analyze (text)
@router.post("", tags=["Analysis"])
async def analyze_risk_endpoint(
    request_data: RiskAnalysisRequest,
    *,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    user_id = current_user.email
    logging.info(f"Analyzing risk for user_id: {user_id}")

    try:
        result = await analyze_risk(request_data.document_text, user_id, db)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Internal server error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# ---------------------------------------------------------------------  analyze (file)
@router.post("/analyze-file", tags=["Analysis"])
async def analyze_document_file(
    file: UploadFile = File(...),
    request: Request = None,
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    user_id = current_user.email

    raw = await file.read()

    class AsyncBytes:
        def __init__(self, b: bytes):
            self._b = b
        async def read(self) -> bytes:
            return self._b

    async_stream = AsyncBytes(raw)
    text = await extract_full_text_from_stream(async_stream, file.filename)
    if text.startswith("Error:"):
        raise HTTPException(status_code=422, detail=text)

    result = await analyze_risk(text, user_id, db, filename=file.filename)
    return {"analysis_result": result}

# ---------------------------------------------------------------------  history
@router.get("/history", tags=["Analysis"])
async def list_user_risk_reports(
    *,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    user_id = current_user.email

    try:
        items = []
        cursor = db["risk_assessments"].find({"user_id": user_id}).sort("_id", -1)
        async for row in cursor:
            items.append(
                {
                    "id": str(row["_id"]),
                    "created_at": row.get("created_at"),
                    "num_risks": len(row.get("risks", [])),
                    "origin": "file" if row.get("filename") else "text",
                    "filename": row.get("filename"),
                    "report_filename": row.get("report_filename"),
                    "report_doc_id": row.get("report_doc_id"),
                }
            )
        return {"history": items}
    except Exception as e:
        logging.error(
            f"Error listing risk reports for user_id {user_id}: {e}", exc_info=True
        )
        raise HTTPException(status_code=500, detail="Internal server error")

# ---------------------------------------------------------------------  single report
@router.get("/{report_id}", tags=["Analysis"])
async def get_risk_report_endpoint(
    report_id: str,
    *,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    user_id = current_user.email

    try:
        result = await get_risk_report(report_id, db)
        if result.get("user_id") != user_id:
            raise HTTPException(
                status_code=403, detail="Access denied. This report does not belong to you."
            )
        return {
            "risk_report": {
                "id": result["_id"],
                "risks": result.get("risks", []),
                "report_doc_id": result.get("report_doc_id"),
                "filename": result.get("filename"),
                "report_filename": result.get("report_filename"),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(
            f"Internal server error while retrieving report: {e}", exc_info=True
        )
        raise HTTPException(status_code=500, detail="Internal server error")

# ---------------------------------------------------------------------  delete report
@router.delete("/{report_id}", tags=["Analysis"])
async def delete_risk_report(
    report_id: str,
    *,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    user_id = current_user.email

    try:
        result = await db.risk_assessments.delete_one(
            {"_id": ObjectId(report_id), "user_id": user_id}
        )
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Not found or not authorized")
        return {"message": "Deleted"}
    except Exception as e:
        logging.error(f"Error deleting risk report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# ---------------------------------------------------------------------  upload PDF
@router.post("/{report_id}/upload-pdf", tags=["Analysis"])
async def upload_risk_pdf(
    report_id: str,
    file: UploadFile = File(...),
    request: Request = None,
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    user_id = current_user.email

    # Check report exists and belongs to user
    report = await db.risk_assessments.find_one(
        {"_id": ObjectId(report_id), "user_id": user_id}
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found or not authorized")

    # Save file to GridFS
    file_bytes = await file.read()
    gridfs_id = await upload_file_to_gridfs(db, file_bytes, file.filename)

    # Update risk_assessments record
    await db.risk_assessments.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {"report_doc_id": str(gridfs_id), "report_filename": file.filename}},
    )

    return {"report_doc_id": str(gridfs_id), "filename": file.filename}

# ---------------------------------------------------------------------  NEW ▶ download PDF
@router.get("/file/{file_id}", tags=["Analysis"])
async def download_risk_pdf_file(
    file_id: str,
    *,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Stream a stored risk-assessment PDF back to the client.

    `file_id` is the raw GridFS ObjectId stored in `risk_assessments.report_doc_id`.
    """
    db = request.app.state.db
    user_id = current_user.email

    # Verify the file belongs to one of the caller's reports
    owner_check = await db.risk_assessments.find_one(
        {"report_doc_id": file_id, "user_id": user_id}
    )
    if not owner_check:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    # Open GridFS stream
    grid_out, filename = await open_gridfs_file(db, file_id)

    async def iterator():
        while chunk := await grid_out.readchunk():
            yield chunk

    mime, _ = mimetypes.guess_type(filename)
    mime = mime or "application/pdf"
    headers = {
        "Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}"
    }
    return StreamingResponse(iterator(), media_type=mime, headers=headers)
