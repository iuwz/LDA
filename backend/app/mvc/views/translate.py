# backend/app/mvc/views/translate.py
from __future__ import annotations

import logging
from typing import Optional
from urllib.parse import quote
from bson import ObjectId
from fastapi import HTTPException
from fastapi import APIRouter, HTTPException, Request, Depends, UploadFile, File, Form
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

from app.mvc.controllers.translate import (
    run_translation_tool,
    run_file_translation_tool,
)
from app.utils.security import get_current_user
from app.mvc.models.user import UserInDB

router = APIRouter(tags=["Translation"])
log = logging.getLogger(__name__)


# ───────────────────────── Schemas ─────────────────────────
class TranslationRequest(BaseModel):
    document_text: str
    target_lang: str


# ─────────────────────────  POST /translate  ─────────────────────────
@router.post("/", summary="Translate raw text")
async def translate_document(
    body: TranslationRequest,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    return await run_translation_tool(
        db,
        document_text=body.document_text,
        target_lang=body.target_lang,
        user_id=current_user.email,
    )


# ─────────────────────  POST /translate/file  ─────────────────────
@router.post("/file", summary="Translate uploaded file")
async def translate_document_file(
    request: Request,
    file: UploadFile = File(...),
    target_lang: str = Form(...),
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    blob, filename, report_id = await run_file_translation_tool(
        db, file, target_lang, current_user.email
    )
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    # front‑end still expects just the DOCX stream:
    return Response(
        content=blob,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers=headers,
    )


# ─────────────────────────  HISTORY  ─────────────────────────
@router.get("/history")
async def list_translation_history(
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db = request.app.state.db
    items = []
    async for row in (
        db.translation_reports.find({"user_id": current_user.email}).sort("_id", -1)
    ):
        items.append(
            {
                "id": str(row["_id"]),
                "created_at": row.get("timestamp"),
                "target_lang": row.get("target_lang"),
                "type": row.get("type", "text"),
                "translated_filename": row.get("translated_filename"),
                "result_doc_id": row.get("result_doc_id"),
            }
        )
    return {"history": items}



# ...

# ───────────── GET one report ─────────────
@router.get("/{report_id}")
async def fetch_translation_report(
    report_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    try:
        oid = ObjectId(report_id)
    except Exception:
        raise HTTPException(400, "Invalid report_id")

    db = request.app.state.db
    doc = await db.translation_reports.find_one(
        {"_id": oid, "user_id": current_user.email}
    )
    if not doc:
        raise HTTPException(404, "Not found")
    doc["_id"] = str(doc["_id"])
    return {"translation_report": doc}

# ───────────── DELETE ─────────────
@router.delete("/{report_id}")
async def delete_translation_report(
    report_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    try:
        oid = ObjectId(report_id)
    except Exception:
        raise HTTPException(400, "Invalid report_id")

    db = request.app.state.db
    res = await db.translation_reports.delete_one(
        {"_id": oid, "user_id": current_user.email}
    )
    if res.deleted_count == 0:
        raise HTTPException(404, "Not found or not yours")
    return {"ok": True}
