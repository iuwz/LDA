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
    # <-- This line adds the security requirement for Swagger
    token: HTTPAuthorizationCredentials = Depends(get_token_credentials),
):
    """
    Upload a file to GridFS and store metadata in the 'documents' collection.
    Because we depend on get_token_credentials, Swagger knows it's Bearer auth.
    """
    user_id = request.state.user_id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    db = request.app.state.db
    file_id = await upload_file_to_gridfs(db, file.file, file.filename)
    doc_id = await store_document_record(db, user_id, file.filename, file_id)

    return {
        "message": f"File '{file.filename}' uploaded successfully",
        "doc_id": doc_id,
        "gridfs_file_id": str(file_id)
    }

@router.get("/")
async def list_my_documents(
    request: Request,
    token: HTTPAuthorizationCredentials = Depends(get_token_credentials),
):
    """
    List all documents uploaded by the authenticated user.
    """
    user_id = request.state.user_id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    db = request.app.state.db
    docs = await list_user_documents(db, user_id)
    return docs

@router.get("/download/{doc_id}")
async def download_document(
    doc_id: str,
    request: Request,
    token: HTTPAuthorizationCredentials = Depends(get_token_credentials),
):
    """
    Download the file from GridFS if the document belongs to the authenticated user.
    Returns a streaming response.
    """
    user_id = request.state.user_id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    db = request.app.state.db
    doc_record = await get_document_record(db, doc_id)
    if doc_record["owner_id"] != user_id:
        raise HTTPException(status_code=403, detail="You do not own this document.")

    grid_out, filename = await open_gridfs_file(db, doc_record["file_id"])

    async def file_iterator(chunk_size=1024 * 1024):
        while True:
            chunk = await grid_out.readchunk(chunk_size)
            if not chunk:
                break
            yield chunk

    return StreamingResponse(file_iterator(), media_type="application/octet-stream", headers={
        "Content-Disposition": f'attachment; filename="{filename}"'
    })
