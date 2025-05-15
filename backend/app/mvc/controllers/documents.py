"""
Document I/O helpers (GridFS + text-extraction).

Key features
------------
1. Robust multi-layer extractor
   • DOCX                → python-docx
   • PDF                 → PyMuPDF → pdfminer.six → optional OCR fallback
   • Plain-text decode   → UTF-8 / Latin-1 best-effort
2. Plain helpers for CRUD in the “documents” collection
3. All functions keep the old names/signatures so nothing breaks
"""

from __future__ import annotations

import io
import logging
from io import BytesIO
from typing import List

from bson import ObjectId
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorGridFSBucket

# ───────────── text-extraction deps ──────────────
import fitz  # PyMuPDF
from pdfminer.high_level import extract_text as miner_extract
from pdfminer.layout import LAParams
from pdf2image import convert_from_bytes

# OCR (optional)
try:
    import pytesseract
    from PIL import Image  # noqa: F401  – used by pytesseract
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

# DOCX (optional)
try:
    from docx import Document as _DocxDocument
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

logger = logging.getLogger(__name__)

# tuned heuristics
MIN_PRINTABLE_RATIO = 0.05     # < 5 % printable → likely garbage
OCR_MAX_PAGES       = 50       # OCR is expensive but we allow up to 50 pages


# ═════════════════ TEXT EXTRACTION ══════════════════
async def extract_full_text_from_stream(stream, filename: str) -> str:
    """
    Extract **plain UTF-8** text from a GridFS / UploadFile stream.

    Order of battle
    1) DOCX                       (python-docx)
    2) PDF  – PyMuPDF             (fast, hybrid aware)
    3) PDF  – pdfminer.six        (ancient / malformed)
    4) PDF  – OCR fallback        (scanned docs, if pytesseract present)
    5) Plain-text best effort     (utf-8 → latin-1)

    Returns a string; on fatal failure the string starts with “Error:”.
    """
    raw = await stream.read()
    ext = filename.rsplit(".", 1)[-1].lower()

    # 1️⃣  DOCX ----------------------------------------------------------------
    if ext in {"docx", "docm", "dotx", "dotm"} and DOCX_AVAILABLE:
        try:
            doc = _DocxDocument(BytesIO(raw))
            txt = "\n".join(p.text for p in doc.paragraphs)
            if _has_enough_text(txt, accept_short=True):
                return txt
        except Exception as e:
            logger.debug("DOCX extraction failed on %s: %s", filename, e)

    # 2️⃣  PDF – PyMuPDF -------------------------------------------------------
    try:
        with fitz.open(stream=raw, filetype="pdf") as doc:
            # blank line between pages → helps GPT understand section breaks
            txt = "\n\n".join(p.get_text("text") for p in doc)
        if _has_enough_text(txt):
            return txt
    except Exception as e:
        logger.debug("PyMuPDF failed on %s: %s", filename, e)

    # 3️⃣  PDF – pdfminer.six ---------------------------------------------------
    try:
        laparams = LAParams(line_margin=0.2, char_margin=2.0, word_margin=0.1)
        txt = miner_extract(io.BytesIO(raw), laparams=laparams)
        if _has_enough_text(txt):
            return txt
    except Exception as e:
        logger.debug("pdfminer failed on %s: %s", filename, e)

    # 4️⃣  OCR fallback ---------------------------------------------------------
    if OCR_AVAILABLE:
        try:
            # best effort: limit to actual page-count or hard cap
            try:
                page_cnt = fitz.open(stream=raw, filetype="pdf").page_count
            except Exception:
                page_cnt = OCR_MAX_PAGES

            images = convert_from_bytes(
                raw,
                dpi=300,
                fmt="png",
                first_page=1,
                last_page=min(page_cnt, OCR_MAX_PAGES),
            )
            ocr_txt: List[str] = [
                pytesseract.image_to_string(img, lang="eng") for img in images
            ]
            txt = "\n".join(ocr_txt)
            if _has_enough_text(txt, accept_short=True):
                return txt
        except Exception as e:
            logger.debug("OCR fallback failed on %s: %s", filename, e)

    # 5️⃣  Plain-text (txt / csv / anything readable) --------------------------
    for enc in ("utf-8", "latin-1"):
        try:
            txt = raw.decode(enc, errors="ignore")
            if _has_enough_text(txt, accept_short=True):
                return txt
        except Exception:
            pass

    # ───── all layers failed ────────────────────────────────────────────────
    logger.error("All extraction layers failed for %s", filename)
    return "Error: Unable to extract text from document."


def _has_enough_text(text: str, *, accept_short: bool = False) -> bool:
    """
    Primitive heuristics: ensure we extracted *real* text.
    """
    if not text:
        return False
    printable = sum(c.isprintable() for c in text)
    ratio = printable / max(len(text), 1)
    return ratio >= MIN_PRINTABLE_RATIO and (len(text) > 100 or accept_short)


# ═════════════════ GRIDFS HELPERS ══════════════════
async def upload_file_to_gridfs(
    db: AsyncIOMotorDatabase, data: bytes, filename: str
):  # -> ObjectId
    fs = AsyncIOMotorGridFSBucket(db, bucket_name="documents_fs")
    return await fs.upload_from_stream(filename, data)


async def store_document_record(
    db: AsyncIOMotorDatabase, owner_id: str, filename: str, file_id
) -> str:
    doc = {"owner_id": owner_id, "filename": filename, "file_id": file_id}
    result = await db.documents.insert_one(doc)
    logger.info("Inserted document %s for user %s", result.inserted_id, owner_id)
    return str(result.inserted_id)


async def list_user_documents(db: AsyncIOMotorDatabase, owner_id: str):
    cur = db.documents.find({"owner_id": owner_id})
    out = []
    async for d in cur:
        d["_id"], d["file_id"] = map(str, (d["_id"], d["file_id"]))
        out.append(d)
    return out


async def list_all_documents(db: AsyncIOMotorDatabase):
    cur = db.documents.find({})
    out = []
    async for d in cur:
        d["_id"], d["file_id"] = map(str, (d["_id"], d["file_id"]))
        out.append(d)
    return out


async def get_document_record(db: AsyncIOMotorDatabase, doc_id: str):
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")

    rec = await db.documents.find_one({"_id": ObjectId(doc_id)})
    if not rec:
        raise HTTPException(status_code=404, detail="Document not found")

    rec["_id"], rec["file_id"] = map(str, (rec["_id"], rec["file_id"]))
    return rec


async def open_gridfs_file(db: AsyncIOMotorDatabase, file_id: str):
    if not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=400, detail="Invalid GridFS file ID")

    fs = AsyncIOMotorGridFSBucket(db, bucket_name="documents_fs")
    try:
        stream = await fs.open_download_stream(ObjectId(file_id))
        return stream, stream.filename
    except Exception as e:
        logger.error("Failed to open GridFS stream %s: %s", file_id, e, exc_info=True)
        raise HTTPException(status_code=404, detail="File not found in GridFS")


async def delete_document(db: AsyncIOMotorDatabase, doc_id: str):
    """
    Delete metadata + GridFS binary.  Idempotent: if the GridFS file is already
    gone the metadata is still removed.
    """
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")

    rec = await get_document_record(db, doc_id)  # validates and fetches

    fs = AsyncIOMotorGridFSBucket(db, bucket_name="documents_fs")
    try:
        await fs.delete(ObjectId(rec["file_id"]))
        logger.info("Deleted GridFS file %s", rec["file_id"])
    except Exception as e:
        logger.error("GridFS delete failed for %s: %s", rec["file_id"], e, exc_info=True)

    await db.documents.delete_one({"_id": ObjectId(doc_id)})
    logger.info("Deleted document record %s", doc_id)
    return {"detail": "Deleted"}