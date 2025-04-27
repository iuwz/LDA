import logging
from fastapi import APIRouter, File, UploadFile, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
from app.mvc.controllers.documents import (
    upload_file_to_gridfs,
    store_document_record,
    list_user_documents,
    list_all_documents,
    get_document_record,
    open_gridfs_file
)
from app.utils.security import get_current_user
from app.mvc.models.user import UserInDB
from urllib.parse import quote

router = APIRouter(tags=["Documents"])
logger = logging.getLogger(__name__)

@router.post("/upload")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Upload a file (PDF/DOCX) to GridFS and record metadata.
    """
    user_id = current_user.email

    # Validate extension
    allowed_ext = {"pdf", "docx"}
    if not any(file.filename.lower().endswith(f".{ext}") for ext in allowed_ext):
        raise HTTPException(status_code=400, detail="Unsupported file type. Only PDF or DOCX allowed.")

    db = request.app.state.db
    file_id = await upload_file_to_gridfs(db, await file.read(), file.filename)
    doc_id = await store_document_record(db, user_id, file.filename, file_id)

    return {
        "message": f"File '{file.filename}' uploaded",
        "doc_id": doc_id,
        "gridfs_file_id": str(file_id)
    }

@router.get("/")
async def list_documents(
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    - Admin: all documents
    - User: own documents
    """
    user_id = current_user.email
    role = current_user.role
    db = request.app.state.db

    if role == "admin":
        docs = await list_all_documents(db)
    else:
        docs = await list_user_documents(db, user_id)
    return docs

@router.get("/download/{doc_id}")
async def download_document(
    doc_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Stream a user’s document from GridFS by doc_id.
    """
    user_id = current_user.email
    db = request.app.state.db

    record = await get_document_record(db, doc_id)
    if record["owner_id"] != user_id:
        raise HTTPException(status_code=403, detail="You do not own this document.")

    grid_out, filename = await open_gridfs_file(db, record["file_id"])

    async def iterator():
        while chunk := await grid_out.readchunk():
            yield chunk

    disp_name = quote(filename)
    headers = {"Content-Disposition": f"attachment; filename*=UTF-8''{disp_name}"}
    return StreamingResponse(iterator(), media_type="application/octet-stream", headers=headers)
