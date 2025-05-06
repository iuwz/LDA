# backend/app/mvc/views/rephrase.py

import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field
from typing import Optional, Union, List, Dict
from bson import ObjectId
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.mvc.controllers.rephrase import run_rephrase_tool
from app.utils.security import get_current_user
from app.mvc.models.user import UserInDB

router = APIRouter(tags=["Rephrase"])
logger = logging.getLogger(__name__)


# ── Request / Response Models ─────────────────────────────────────────

class RephraseRequest(BaseModel):
    document_text: Optional[str] = Field(
        None, description="Text to rephrase (if doc_id not provided)"
    )
    doc_id: Optional[str] = Field(
        None, description="Document ID to rephrase (if document_text not provided)"
    )
    style: str = Field(..., description="Rephrasing style (formal, clear, etc.)")


class RephraseTextResponse(BaseModel):
    report_id: str
    rephrased_text: str
    changes: List[Dict[str, str]]


class RephraseDocumentResponse(BaseModel):
    report_id: str
    rephrased_doc_id: str
    rephrased_doc_filename: str
    changes: List[Dict[str, str]]


class HistoryItemOut(BaseModel):
    id: str
    style: str
    created_at: datetime
    type: str
    filename: Optional[str]
    result_doc_id: Optional[str]
    result_text: Optional[str]


class HistoryResponse(BaseModel):
    history: List[HistoryItemOut]


# ── POST /rephrase ────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=Union[RephraseTextResponse, RephraseDocumentResponse],
)
async def rephrase_handler(
    request_body: RephraseRequest,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db: AsyncIOMotorDatabase = request.app.state.db
    try:
        result = await run_rephrase_tool(
            db,
            user_id=current_user.email,
            style=request_body.style,
            document_text=request_body.document_text,
            doc_id=request_body.doc_id,
        )
        return result
    except HTTPException:
        raise
    except Exception:
        logger.exception("Rephrase handler error")
        raise HTTPException(status_code=500, detail="Internal server error")


# ── GET /rephrase/history ────────────────────────────────────────────

@router.get("/history", response_model=HistoryResponse)
async def get_history(
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db: AsyncIOMotorDatabase = request.app.state.db

    # fetch this user's reports, newest first
    cursor = (
        db.rephrase_reports
        .find({"user_id": current_user.email})
        .sort("created_at", -1)
    )

    items: List[HistoryItemOut] = []
    async for r in cursor:
        # some older records may not have created_at—fall back to the ObjectId timestamp
        ts = r.get("created_at")
        if ts is None:
            ts = r["_id"].generation_time

        items.append(
            HistoryItemOut(
                id=str(r["_id"]),
                style=r["style"],
                created_at=ts,
                type="doc" if r.get("rephrased_doc_id") else "text",
                filename=r.get("rephrased_output_summary"),
                result_doc_id=r.get("rephrased_doc_id"),
                result_text=(
                    r.get("rephrased_output_summary")
                    if not r.get("rephrased_doc_id") else None
                ),
            )
        )

    return HistoryResponse(history=items)


# ── DELETE /rephrase/{id} ────────────────────────────────────────────

@router.delete("/{report_id}")
async def delete_report(
    report_id: str,
    request: Request,
    current_user: UserInDB = Depends(get_current_user),
):
    db: AsyncIOMotorDatabase = request.app.state.db
    row = await db.rephrase_reports.find_one({"_id": ObjectId(report_id)})

    if not row or row["user_id"] != current_user.email:
        raise HTTPException(status_code=404, detail="Not found")

    # if there's a GridFS doc attached, remove it too
    if row.get("rephrased_doc_id"):
        await db.fs.files.delete_one({"_id": ObjectId(row["rephrased_doc_id"])})

    await db.rephrase_reports.delete_one({"_id": ObjectId(report_id)})
    return {"ok": True}
