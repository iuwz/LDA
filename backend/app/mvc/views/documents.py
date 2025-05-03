# backend/app/mvc/views/documents.py
import logging # Import the logging module
import mimetypes
from urllib.parse import quote
from io import BytesIO # Import BytesIO for reading stream content

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorGridFSBucket

from fastapi import (
    APIRouter,
    File,
    UploadFile,
    Request,
    HTTPException,
    Depends,
    Response # Import Response for plain text
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

# Setup logger for this module
logger = logging.getLogger(__name__)


# Import libraries for document conversion (add these to your requirements.txt)
# You will need to install these:
# pip install python-docx PyPDF2 pdfminer.six
try:
    from docx import Document as DocxDocument
    logger.info("python-docx library found.")
except ImportError:
    DocxDocument = None
    logger.warning("python-docx not installed. DOCX content extraction will be limited.")
try:
    from PyPDF2 import PdfReader
    logger.info("PyPDF2 library found.")
except ImportError:
    PdfReader = None
    logger.warning("PyPDF2 not installed. PDF content extraction will be basic.")
# While pdfminer.six is useful, PyPDF2 is simpler for basic text extraction
# from PyPDF2.errors import PdfReadError


router = APIRouter(tags=["Documents"])


# Helper function to extract text
async def extract_text_from_stream(stream, filename: str):
    """
    Attempts to extract text from a file stream based on its extension.
    Requires python-docx and PyPDF2/pdfminer.six libraries installed.
    NOTE: This is a basic implementation and may not handle all document complexities
    like scanned images, complex layouts, or encrypted files.
    """
    file_extension = filename.split('.')[-1].lower()
    # Read the entire stream content into memory for processing
    try:
        content = await stream.read()
    except Exception as e:
        logger.error(f"Failed to read file stream for {filename}: {e}")
        return f"Error reading file content: {e}"


    if file_extension == 'docx' and DocxDocument:
        try:
            doc = DocxDocument(BytesIO(content))
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text
        except Exception as e:
            logger.error(f"Error extracting text from DOCX {filename}: {e}")
            return f"Error extracting text from DOCX file: {filename}. Content preview might be incomplete or unavailable."
    elif file_extension == 'pdf' and PdfReader:
        try:
            reader = PdfReader(BytesIO(content))
            text = ""
            # check if the PDF is encrypted
            if reader.is_encrypted:
                logger.warning(f"PDF file {filename} is encrypted, cannot extract text.")
                return f"PDF file: {filename} is encrypted. Content preview not available."

            for page_num in range(len(reader.pages)):
                # Use get_text() which is more robust than extract_text() in newer PyPDF2
                page = reader.pages[page_num]
                text += page.get_text() or ""
            return text
        except Exception as e: # Catching a broad exception for robustness
            logger.error(f"Error extracting text from PDF {filename}: {e}")
            return f"Error extracting text from PDF file: {filename}. Content preview might be incomplete or unavailable."
    else:
        # Attempt to decode as text for other files or if libraries are missing
        try:
            # Assumes UTF-8 encoding, adjust if necessary
            return content.decode('utf-8')
        except Exception:
            # If decoding fails, try other common encodings or return a message
            try:
                return content.decode('latin-1')
            except Exception:
                 logger.warning(f"Could not decode file {filename} as UTF-8 or latin-1 text.")
                 return f"Could not display content for file: {filename}. Format not supported or text decoding failed."


# ───────────────────────── upload ─────────────────────────
@router.post("/upload")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user),
):
    """Upload a PDF or DOCX to GridFS and store metadata."""
    user_id = current_user.email

    # You can add file type restrictions here if needed, but the text extraction
    # logic below already handles unsupported types gracefully.
    # allowed_ext = {"pdf", "docx"}
    # if not any(file.filename.lower().endswith(f".{ext}") for ext in allowed_ext):
    #     raise HTTPException(
    #         status_code=400, detail="Unsupported file type. Only PDF or DOCX allowed."
    #     )

    db = request.app.state.db
    # Read file content in chunks if it can be very large, but for text extraction
    # we often need the whole content. Reading all at once for simplicity here.
    file_content = await file.read()

    file_id = await upload_file_to_gridfs(db, file_content, file.filename)
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

# ───────────────────────── get content ────────────────────
@router.get("/content/{doc_id}")
async def get_document_content(
    doc_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    """Retrieve the text content of a document."""
    db = request.app.state.db

    record = await get_document_record(db, doc_id)
    if record["owner_id"] != current_user.email and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not own this document.")

    # Open the GridFS file stream
    grid_out, filename = await open_gridfs_file(db, record["file_id"])

    # Extract text from the file stream
    document_text = await extract_text_from_stream(grid_out, filename)

    return Response(content=document_text, media_type="text/plain")


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