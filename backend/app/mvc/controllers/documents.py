# backend/app/mvc/controllers/documents.py

import logging
from bson import ObjectId
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from motor.motor_asyncio import AsyncIOMotorGridFSBucket

logger = logging.getLogger(__name__)

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
    except:
        raise HTTPException(status_code=404, detail="File not found in GridFS")
