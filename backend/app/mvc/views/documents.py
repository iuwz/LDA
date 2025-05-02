# backend/app/mvc/views/documents.py
import logging
import mimetypes
from urllib.parse import quote

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorGridFSBucket

from fastapi import (
    APIRouter,
    File,
    UploadFile,
    Request,
    HTTPException,
    Depends,
)
from fastapi.responses import StreamingResponse

from app.mvc.controllers.documents import (
    upload_file_to_gridfs,
    store_document_record,
    list_user_documents,
    list_all_documents,
    get_document_record,
    open_gridfs_file,
)
from app.utils.security import get_current_user
from app.mvc.models.user import UserInDB

router = APIRouter(tags=["Documents"])
logger = logging.getLogger(__name__)


# ───────────────────────── upload ─────────────────────────
@router.post("/upload")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user),
):
    """Upload a PDF or DOCX to GridFS and store metadata."""
    user_id = current_user.email

    allowed_ext = {"pdf", "docx"}
    if not any(file.filename.lower().endswith(f".{ext}") for ext in allowed_ext):
        raise HTTPException(
            status_code=400, detail="Unsupported file type. Only PDF or DOCX allowed."
        )

    db = request.app.state.db
    file_id = await upload_file_to_gridfs(db, await file.read(), file.filename)
    doc_id = await store_document_record(db, user_id, file.filename, file_id)

    return {"message": "File uploaded", "doc_id": doc_id, "file_id": str(file_id)}


# ───────────────────────── list ───────────────────────────
@router.get("/")
async def list_documents(
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """Admin sees all docs; regular users see only their own."""
    db = request.app.state.db
    if current_user.role == "admin":
        return await list_all_documents(db)
    return await list_user_documents(db, current_user.email)


# ───────────────────────── download ───────────────────────
@router.get("/download/{doc_id}")
async def download_document(
    doc_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """Always force a download (no preview inline)."""
    db = request.app.state.db

    record = await get_document_record(db, doc_id)
    if record["owner_id"] != current_user.email and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not own this document.")

    grid_out, filename = await open_gridfs_file(db, record["file_id"])

    async def iterator():
        while chunk := await grid_out.readchunk():
            yield chunk

    mime, _ = mimetypes.guess_type(filename)
    mime = mime or "application/octet-stream"

    disp_name = quote(filename)
    headers = {"Content-Disposition": f"attachment; filename*=UTF-8''{disp_name}"}

    return StreamingResponse(iterator(), media_type=mime, headers=headers)


# ───────────────────────── delete ─────────────────────────
@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """Delete a document record *and* its GridFS file."""
    db = request.app.state.db

    record = await get_document_record(db, doc_id)
    if record["owner_id"] != current_user.email and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not own this document.")

    # 1) delete GridFS file
    fs = AsyncIOMotorGridFSBucket(db, bucket_name="documents_fs")  # type: ignore
    await fs.delete(ObjectId(record["file_id"]))  # type: ignore

    # 2) delete metadata record
    await db.documents.delete_one({"_id": ObjectId(doc_id)})  # type: ignore

    return {"detail": "Deleted"}
