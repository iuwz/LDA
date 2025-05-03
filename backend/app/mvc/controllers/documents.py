# backend/app/mvc/controllers/documents.py

import logging
import mimetypes
from urllib.parse import quote
from io import BytesIO # Import BytesIO for reading stream content
import os # Import os for path splitting

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from motor.motor_asyncio import AsyncIOMotorGridFSBucket

from fastapi import HTTPException

# Import libraries for document conversion (add these to your requirements.txt)
# You will need to install these:
# pip install python-docx PyPDF2
try:
    from docx import Document as DocxDocument
    logger = logging.getLogger(__name__)
    logger.info("python-docx library found.")
except ImportError:
    DocxDocument = None
    logger = logging.getLogger(__name__)
    logger.warning("python-docx not installed. DOCX content extraction will be limited.")
try:
    # Using the newer PdfReader from PyPDF2
    from PyPDF2 import PdfReader
    logger = logging.getLogger(__name__)
    logger.info("PyPDF2 library found for PDF reading.")
except ImportError:
    PdfReader = None
    logger = logging.getLogger(__name__)
    logger.warning("PyPDF2 not installed. PDF reading for rephrasing unavailable.")


logger = logging.getLogger(__name__) # Ensure logger is defined here


# Helper function to extract ALL text from a document stream
async def extract_full_text_from_stream(stream, filename: str) -> str:
    """
    Attempts to extract all text content from a file stream.
    Requires python-docx and PyPDF2 libraries installed.
    NOTE: This is a basic implementation and may not handle all document complexities
    like scanned images, complex layouts, or encrypted files.
    """
    file_extension = filename.split('.')[-1].lower()
    text_content = ""

    try:
        # Read the entire stream content into memory
        # Consider adding a size limit here to prevent loading huge files into memory
        content = await stream.read()

    except Exception as e:
        logger.error(f"Failed to read file stream for {filename}: {e}")
        return f"Error reading file content: {e}"


    if file_extension == 'docx' and DocxDocument:
        try:
            doc = DocxDocument(BytesIO(content))
            paragraphs = [paragraph.text for paragraph in doc.paragraphs]
            # You might need to handle tables, headers, footers, etc.
            # For this example, we'll focus on paragraphs.
            text_content = "\n".join(paragraphs)
            logger.info(f"Extracted text from DOCX: {filename}")
        except Exception as e:
            logger.error(f"Error extracting text from DOCX {filename}: {e}")
            text_content = f"Error extracting text from DOCX file: {filename}. Content preview might be incomplete or unavailable. {e}"
    elif file_extension == 'pdf' and PdfReader:
        try:
            reader = PdfReader(BytesIO(content))
            text = ""
            # check if the PDF is encrypted
            if reader.is_encrypted:
                logger.warning(f"PDF file {filename} is encrypted, cannot extract text.")
                return f"Error: PDF file {filename} is encrypted. Cannot extract text."

            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                # Use extract_text()
                text += page.extract_text() or ""
            text_content = text
            logger.info(f"Extracted text from PDF: {filename}")
        except Exception as e: # Catching a broad exception for robustness
            logger.error(f"Error extracting text from PDF {filename}: {e}")
            text_content = f"Error extracting text from PDF file: {filename}. Content preview might be incomplete or unavailable. {e}"
    else:
        logger.warning(f"Unsupported file type for text extraction: {file_extension}")
        # Attempt to decode as text for other files or if libraries are missing
        try:
            # Assumes UTF-8 encoding, adjust if necessary
            text_content = content.decode('utf-8')
        except Exception:
            # If decoding fails, try other common encodings or return a message
            try:
                text_content = content.decode('latin-1')
            except Exception:
                 logger.warning(f"Could not decode file {filename} as UTF-8 or latin-1 text.")
                 text_content = f"Could not display content for file: {filename}. Format not supported or text decoding failed."

    return text_content

# ───────────────────────── Controllers related to Documents ─────────────────────────
# (Keep your existing functions like upload_file_to_gridfs, store_document_record,
# list_user_documents, list_all_documents, get_document_record, open_gridfs_file, delete_document here)

async def upload_file_to_gridfs(db: AsyncIOMotorDatabase, file_data, filename: str):
    """
    Uploads the file (file_data) to MongoDB GridFS with the given filename.
    Returns the file_id (GridFS _id).
    """
    fs = AsyncIOMotorGridFSBucket(db, bucket_name="documents_fs")
    file_id = await fs.upload_from_stream(filename, file_data)
    return file_id

async def store_document_record(db: AsyncIOMotorDatabase, user_id: str, filename: str, file_id):
    """
    Store a reference to the uploaded GridFS file in a separate 'documents' collection,
    so we can track ownership, filename, etc.
    """
    doc = {
        "owner_id": user_id,
        "filename": filename,
        "file_id": file_id  # The GridFS _id
    }
    result = await db.documents.insert_one(doc)
    logger.info(f"Inserted document record with _id={result.inserted_id} for user={user_id}")
    return str(result.inserted_id)

async def list_user_documents(db: AsyncIOMotorDatabase, user_id: str):
    """
    Return all document records belonging to a particular user.
    """
    docs_cursor = db.documents.find({"owner_id": user_id})
    docs = []
    async for doc in docs_cursor:
        doc["_id"] = str(doc["_id"])
        doc["file_id"] = str(doc["file_id"])
        docs.append(doc)
    return docs

async def list_all_documents(db: AsyncIOMotorDatabase):
    """
    Return all document records, for Admin usage.
    """
    docs_cursor = db.documents.find({})
    docs = []
    async for doc in docs_cursor:
        doc["_id"] = str(doc["_id"])
        doc["file_id"] = str(doc["file_id"])
        docs.append(doc)
    return docs

async def get_document_record(db: AsyncIOMotorDatabase, doc_id: str):
    """
    Retrieve a single document record by _id from the documents collection.
    """
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")

    doc = await db.documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc["_id"] = str(doc["_id"])
    doc["file_id"] = str(doc["file_id"])
    return doc

async def open_gridfs_file(db: AsyncIOMotorDatabase, file_id: str):
    """
    Open a download stream from GridFS for the given file_id.
    Returns (gridfs_stream, filename).
    """
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid GridFS file ID")

    fs = AsyncIOMotorGridFSBucket(db, bucket_name="documents_fs")
    try:
        grid_out = await fs.open_download_stream(ObjectId(file_id))
        filename = grid_out.filename
        return grid_out, filename
    except Exception as e: # Catch any exception during stream opening
        logger.error(f"Failed to open GridFS stream for file_id {file_id}: {e}", exc_info=True)
        raise HTTPException(status_code=404, detail="File not found or accessible in GridFS")

async def delete_document(db: AsyncIOMotorDatabase, doc_id: str):
    """Delete a document record *and* its GridFS file."""
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")

    # Use get_document_record to ensure existence and get file_id
    record = await get_document_record(db, doc_id)

    # 1) delete GridFS file
    fs = AsyncIOMotorGridFSBucket(db, bucket_name="documents_fs") # type: ignore
    try:
        await fs.delete(ObjectId(record["file_id"])) # type: ignore
        logger.info(f"Deleted GridFS file {record['file_id']} for document {doc_id}")
    except Exception as e:
         logger.error(f"Failed to delete GridFS file {record['file_id']} for document {doc_id}: {e}", exc_info=True)
         # Decide if you want to block document record deletion if file deletion fails.
         # For now, log and proceed to delete the record.


    # 2) delete metadata record
    try:
        delete_result = await db.documents.delete_one({"_id": ObjectId(doc_id)}) # type: ignore
        if delete_result.deleted_count == 1:
             logger.info(f"Deleted document record {doc_id}")
        else:
             logger.warning(f"Document record {doc_id} not found for deletion.")
    except Exception as e:
         logger.error(f"Failed to delete document record {doc_id}: {e}", exc_info=True)
         raise HTTPException(status_code=500, detail=f"Failed to delete document record: {e}")

    return {"detail": "Deleted"}