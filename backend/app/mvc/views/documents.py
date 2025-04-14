# backend/app/mvc/views/documents.py

import logging
from fastapi import APIRouter, File, UploadFile, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials

# Import your existing code for GridFS, etc.
from app.mvc.controllers.documents import (
    upload_file_to_gridfs,
    store_document_record,
    list_user_documents,
    list_all_documents,
    get_document_record,
    open_gridfs_file
)

# Bearer auth dependency (for Swagger docs)
from app.utils.security import get_token_credentials

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/upload")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    token: HTTPAuthorizationCredentials = Depends(get_token_credentials),
):
    """
    Upload a file to GridFS and store metadata in the 'documents' collection.
    Only allows PDF or DOCX files.
    """
    user_id = request.state.user_id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    # --- File type validation ---
    allowed_extensions = {"pdf", "docx"}
    filename_lower = file.filename.lower()
    if not any(filename_lower.endswith(f".{ext}") for ext in allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Only PDF or DOCX are allowed."
        )

    db = request.app.state.db
    file_id = await upload_file_to_gridfs(db, file.file, file.filename)
    doc_id = await store_document_record(db, user_id, file.filename, file_id)

    return {
        "message": f"File '{file.filename}' uploaded successfully",
        "doc_id": doc_id,
        "gridfs_file_id": str(file_id)
    }

@router.get("/")
async def list_documents(
    request: Request,
    token: HTTPAuthorizationCredentials = Depends(get_token_credentials),
):
    """
    List documents based on user role:
    - Admin: lists all documents
    - User: lists only their own documents
    """
    user_id = request.state.user_id
    user_role = getattr(request.state, "user_role", "user")  # Default to "user" if not found
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    db = request.app.state.db

    if user_role == "admin":
        docs = await list_all_documents(db)
    else:
        docs = await list_user_documents(db, user_id)
    return docs
@router.get("/download/{doc_id}")
async def download_document(
    doc_id: str,
    request: Request,
    token: HTTPAuthorizationCredentials = Depends(get_token_credentials),
):
    user_id = request.state.user_id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    db = request.app.state.db
    doc_record = await get_document_record(db, doc_id)
    if doc_record["owner_id"] != user_id:
        raise HTTPException(status_code=403, detail="You do not own this document.")

    grid_out, filename = await open_gridfs_file(db, doc_record["file_id"])

    async def file_iterator():
        while True:
            chunk = await grid_out.readchunk()  # No parameter is passed here.
            if not chunk:
                break
            yield chunk

    # Use RFC 6266 header formatting for UTF-8 filenames.
    from urllib.parse import quote
    encoded_filename = quote(filename)
    content_disposition = f"attachment; filename*=UTF-8''{encoded_filename}"

    return StreamingResponse(
        file_iterator(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": content_disposition}
    )
