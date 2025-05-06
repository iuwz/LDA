# backend/app/mvc/controllers/compliance.py
"""
Compliance (Saudi‑Arabia) controller.

Responsibilities
────────────────
• run_compliance_check  – performs GPT / fallback scan, writes DB row,
  renders a PDF, uploads it to GridFS, patches the row with `report_doc_id`
  and `report_filename`, then returns everything the GUI needs.

• get_compliance_report – fetches one stored report (enforces ownership).

• generate_compliance_report_docx / _pdf – produce a portable report file.
"""

from __future__ import annotations

import datetime as _dt
import json
import logging
import re
from io import BytesIO
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool
from motor.motor_asyncio import AsyncIOMotorDatabase

from docx import Document
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Table,
    TableStyle,
    Spacer,
)
from reportlab.lib.styles import getSampleStyleSheet

from app.core.openai_client import call_gpt
from app.mvc.controllers.documents import (
    get_document_record,
    open_gridfs_file,
    extract_full_text_from_stream,
    upload_file_to_gridfs,
    store_document_record,
)
from app.mvc.models.compliance import ComplianceIssue

logger = logging.getLogger(__name__)

# ───────────────────────────  DEMO fallback rules  ───────────────────────────

MOCK_RULES = [
    {"rule_id": "R1",  "pattern": "Confidential",
     "description": "Document marked confidential requires an NDA clause"},
    {"rule_id": "R2",  "pattern": "Penalty",
     "description": "Check if penalty exceeds legal limit"},
    {"rule_id": "R3",  "pattern": "Jurisdiction",
     "description": "Ensure governing law and jurisdiction clauses are present"},
    {"rule_id": "R4",  "pattern": "indefinitely",
     "description": "Data retention period must be finite and clearly defined."},
    {"rule_id": "R5",  "pattern": r"sub[ -]processors",
     "description": "Usage of Sub‑processors must be limited and disclosed."},
    {"rule_id": "R6",  "pattern": "legitimate interests",
     "description": "Legitimate interests as lawful basis requires balancing test."},
    {"rule_id": "R7",  "pattern": "any country",
     "description": "International transfers need safeguards (e.g., SCCs)."},
    {"rule_id": "R8",  "pattern": "Data Subjects",
     "description": "Processor must assist with Data‑Subject rights by law."},
    {"rule_id": "R9",  "pattern": "indirect",
     "description": "Unlimited exclusion of liability is unenforceable."},
    {"rule_id": "R10", "pattern": "arbitration",
     "description": "Arbitration location must be specified and fair."},
]

# ─────────────────────────────── Helpers ────────────────────────────────


def _extract_snippet(text: str, pattern: str, win: int = 100) -> str:
    """Return an excerpt (…snippet…) around first occurrence of *pattern*."""
    m = re.search(re.escape(pattern), text, re.IGNORECASE)
    if not m:
        return f"(snippet for '{pattern}' not found)"
    s, e = max(0, m.start() - win), min(len(text), m.end() + win)
    return ("…" if s else "") + text[s:e] + ("…" if e < len(text) else "")


def _heuristic_score(issues: List[Dict[str, Any]]) -> int:
    """Deduct 20/10/5 pts for non‑compliant / warning / unknown findings."""
    bad = warn = unk = 0
    for i in issues:
        st = i["status"].lower()
        if st == "issue found":
            bad += 1
        elif st == "warning":
            warn += 1
        elif st != "ok":
            unk += 1
    penalty = bad * 20 + warn * 10 + unk * 5
    return max(0, 100 - penalty)


async def _store_pdf(
    db: AsyncIOMotorDatabase,
    user_id: str,
    buf: BytesIO,
    filename: str,
) -> str:
    """Upload buffer to GridFS, create a document record, return doc‑id."""
    buf.seek(0)
    grid_id = await upload_file_to_gridfs(db, buf.read(), filename)
    return await store_document_record(db, user_id, filename, grid_id)


# ═════════════════════════════════ PUBLIC API ══════════════════════════════

async def run_compliance_check(
    db: AsyncIOMotorDatabase,
    user_id: str,
    *,
    document_text: Optional[str] = None,
    doc_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Analyse compliance, create PDF, upload it – return:
    { report_id, issues, compliance_score, report_doc_id, report_filename }
    """
    if not (document_text or doc_id):
        raise HTTPException(400, "Either document_text or doc_id must be provided.")
    if document_text and doc_id:
        raise HTTPException(400, "Provide only one of document_text or doc_id.")

    # ── if doc_id given ⇒ extract the text ────────────────────────────────
    if doc_id:
        rec = await get_document_record(db, doc_id)
        stream, fname = await open_gridfs_file(db, rec["file_id"])
        document_text = await extract_full_text_from_stream(stream, fname)
        if document_text.startswith("Error"):
            raise HTTPException(422, document_text)

    # ── GPT extraction of issues (best‑effort) ────────────────────────────
    gpt_issues: List[Dict[str, Any]] = []
    try:
        sys_msg = (
            "You are a compliance AI assistant. Identify issues and output JSON only:\n"
            "{'issues':[{'rule_id','description','status','extracted_text_snippet'}]}"
        )
        resp = call_gpt(prompt=document_text, system_message=sys_msg, temperature=0.2)
        parsed = json.loads(resp)
        if isinstance(parsed.get("issues"), list):
            for raw in parsed["issues"]:
                try:
                    gpt_issues.append(ComplianceIssue(**raw).model_dump())
                except Exception:
                    continue
    except Exception:
        logger.info("GPT issue extraction failed, using fallback rules.")

    # ── fallback rule‑based scan ──────────────────────────────────────────
    issues = gpt_issues.copy()
    if not issues:
        for rule in MOCK_RULES:
            if re.search(rule["pattern"], document_text, re.IGNORECASE):
                issues.append(
                    {
                        "rule_id": rule["rule_id"],
                        "description": rule["description"],
                        "status": "Issue Found",
                        "extracted_text_snippet": _extract_snippet(
                            document_text, rule["pattern"]
                        ),
                    }
                )
        if not issues:
            issues.append(
                {
                    "rule_id": "None",
                    "description": "No compliance issues detected by basic scan.",
                    "status": "OK",
                    "extracted_text_snippet": None,
                }
            )

    # ── ask GPT for overall score (optional) ──────────────────────────────
    gpt_score: Optional[int] = None
    try:
        score_msg = (
            "Rate the overall compliance of the document with Saudi data‑protection "
            "law on a 0‑100 scale (100 = perfectly compliant). Respond ONLY with "
            "the number."
        )
        score_resp = call_gpt(
            prompt=document_text, system_message=score_msg, temperature=0
        )
        gpt_score = int(re.search(r"\d+", score_resp).group())
    except Exception:
        logger.info("GPT scoring failed, reverting to heuristic.")

    heuristic_score = _heuristic_score(issues)
    compliance_score = gpt_score if gpt_score is not None else heuristic_score

    # ── persist primary document row ──────────────────────────────────────
    preview = document_text[:500] + ("…" if len(document_text) > 500 else "")
    row = {
        "user_id": user_id,
        "document_text_preview": preview,
        "original_doc_id": doc_id,
        "issues": issues,
        "compliance_score": compliance_score,
        "timestamp": _dt.datetime.utcnow(),
    }
    ins = await db.compliance_reports.insert_one(row)
    report_id = str(ins.inserted_id)

    # ── generate PDF in threadpool (ReportLab is blocking) ────────────────
    pdf_buf: BytesIO = await run_in_threadpool(
        generate_compliance_report_pdf, {**row, "_id": report_id}
    )
    pdf_name = f"compliance_report_{report_id}.pdf"
    report_doc_id = await _store_pdf(db, user_id, pdf_buf, pdf_name)

    # ── update row with PDF metadata ──────────────────────────────────────
    await db.compliance_reports.update_one(
        {"_id": ins.inserted_id},
        {"$set": {"report_doc_id": report_doc_id, "report_filename": pdf_name}},
    )

    return {
        "report_id": report_id,
        "issues": issues,
        "compliance_score": compliance_score,
        "report_doc_id": report_doc_id,
        "report_filename": pdf_name,
    }


async def get_compliance_report(
    db: AsyncIOMotorDatabase,
    report_id: str,
    user_id: str,
) -> Dict[str, Any]:
    """Retrieve a stored report (enforces ownership)."""
    if not ObjectId.is_valid(report_id):
        raise HTTPException(400, "Invalid report ID.")
    doc = await db.compliance_reports.find_one(
        {"_id": ObjectId(report_id), "user_id": user_id}
    )
    if not doc:
        raise HTTPException(404, "Report not found or access denied.")
    doc["_id"] = str(doc["_id"])
    return doc

# ═════════════════════ DOCX / PDF generators ═════════════════════


def generate_compliance_report_docx(report_data: Dict[str, Any]) -> BytesIO:
    buf = BytesIO()
    document = Document()

    # Cover page ----------------------------------------------------
    document.add_heading("Compliance Report", level=0)
    meta = document.add_table(rows=5, cols=2, style="Light List Accent 1")
    meta.cell(0, 0).text, meta.cell(0, 1).text = (
        "Report ID:", report_data.get("_id", "N/A")
    )
    ts = report_data.get("timestamp")
    meta.cell(1, 0).text, meta.cell(1, 1).text = (
        "Generated At:",
        ts.strftime("%Y‑%m‑%d %H:%M:%S UTC") if ts else "N/A",
    )
    meta.cell(2, 0).text, meta.cell(2, 1).text = (
        "User:", report_data.get("user_id", "N/A")
    )
    meta.cell(3, 0).text, meta.cell(3, 1).text = (
        "Document:", report_data.get("original_doc_id", "N/A")
    )
    meta.cell(4, 0).text, meta.cell(4, 1).text = (
        "Compliance Score:", str(report_data.get("compliance_score", "N/A"))
    )
    document.add_page_break()

    # Summary -------------------------------------------------------
    document.add_heading("1. Summary of Findings", level=1)
    counts = {"Compliant": 0, "Non-Compliant": 0, "Warning": 0, "Unknown": 0}
    for issue in report_data["issues"]:
        st = issue["status"].lower()
        if st == "ok":
            counts["Compliant"] += 1
        elif st == "issue found":
            counts["Non-Compliant"] += 1
        elif st == "warning":
            counts["Warning"] += 1
        else:
            counts["Unknown"] += 1

    tbl = document.add_table(rows=2, cols=5, style="Light Grid Accent 2")
    tbl.rows[0].cells[0].text, tbl.rows[1].cells[0].text = (
        "Total Issues", str(len(report_data["issues"]))
    )
    tbl.rows[0].cells[1].text, tbl.rows[1].cells[1].text = (
        "Compliant", str(counts["Compliant"])
    )
    tbl.rows[0].cells[2].text, tbl.rows[1].cells[2].text = (
        "Non‑Compliant", str(counts["Non-Compliant"])
    )
    tbl.rows[0].cells[3].text, tbl.rows[1].cells[3].text = (
        "Warning", str(counts["Warning"])
    )
    tbl.rows[0].cells[4].text, tbl.rows[1].cells[4].text = (
        "Unknown", str(counts["Unknown"])
    )
    document.add_page_break()

    # Detailed issues ----------------------------------------------
    document.add_heading("2. Detailed Issues", level=1)
    for idx, issue in enumerate(report_data["issues"], start=1):
        document.add_heading(f"Issue {idx}", level=2)
        t = document.add_table(rows=4, cols=2, style="Light List Accent 1")
        t.cell(0, 0).text, t.cell(0, 1).text = "Rule ID", issue.get("rule_id", "")
        t.cell(1, 0).text, t.cell(1, 1).text = "Status", issue.get("status", "")
        t.cell(2, 0).text, t.cell(2, 1).text = (
            "Description", issue.get("description", "")
        )
        t.cell(3, 0).text, t.cell(3, 1).text = (
            "Relevant Snippet", issue.get("extracted_text_snippet") or "–"
        )
        document.add_paragraph("")

    # Footer --------------------------------------------------------
    footer = document.sections[-1].footer
    footer.paragraphs[0].text = (
        f"Generated on {_dt.datetime.utcnow():%Y‑%m‑%d %H:%M:%S UTC}"
    )
    footer.paragraphs[0].alignment = 1

    document.save(buf)
    buf.seek(0)
    return buf


def generate_compliance_report_pdf(report_data: Dict[str, Any]) -> BytesIO:
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()
    elems = []

    # Title + meta --------------------------------------------------
    elems.append(Paragraph("Compliance Report", styles["Title"]))
    elems.append(Spacer(1, 12))
    ts = report_data.get("timestamp")
    meta_tbl = Table(
        [
            ["Report ID:", report_data.get("_id", "N/A")],
            [
                "Generated At:",
                ts.strftime("%Y‑%m‑%d %H:%M:%S UTC") if ts else "N/A",
            ],
            ["User:", report_data.get("user_id", "N/A")],
            ["Document:", report_data.get("original_doc_id", "N/A")],
            ["Compliance Score:", str(report_data.get("compliance_score", "N/A"))],
        ],
        colWidths=[120, 330],
    )
    meta_tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("BOX", (0, 0), (-1, -1), 1, colors.black),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ]
        )
    )
    elems.append(meta_tbl)
    elems.append(Spacer(1, 24))

    # Summary -------------------------------------------------------
    elems.append(Paragraph("1. Summary of Findings", styles["Heading2"]))
    counts = {"Compliant": 0, "Non-Compliant": 0, "Warning": 0, "Unknown": 0}
    for issue in report_data["issues"]:
        st = issue["status"].lower()
        if st == "ok":
            counts["Compliant"] += 1
        elif st == "issue found":
            counts["Non-Compliant"] += 1
        elif st == "warning":
            counts["Warning"] += 1
        else:
            counts["Unknown"] += 1
    sum_tbl = Table(
        [
            ["Total Issues", "Compliant", "Non‑Compliant", "Warning", "Unknown"],
            [
                str(len(report_data["issues"])),
                str(counts["Compliant"]),
                str(counts["Non-Compliant"]),
                str(counts["Warning"]),
                str(counts["Unknown"]),
            ],
        ],
        colWidths=[90] * 5,
    )
    sum_tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightblue),
                ("BOX", (0, 0), (-1, -1), 1, colors.black),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ]
        )
    )
    elems.append(sum_tbl)
    elems.append(Spacer(1, 24))

    # Detailed issues ----------------------------------------------
    elems.append(Paragraph("2. Detailed Issues", styles["Heading2"]))
    for idx, issue in enumerate(report_data["issues"], 1):
        elems.append(
            Paragraph(f"Issue {idx}: {issue.get('description')}", styles["Heading3"])
        )
        det_tbl = Table(
            [
                ["Rule ID", issue.get("rule_id", "")],
                ["Status", issue.get("status", "")],
                ["Description", issue.get("description", "")],
                [
                    "Relevant Snippet",
                    issue.get("extracted_text_snippet") or "–",
                ],
            ],
            colWidths=[120, 330],
        )
        det_tbl.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),
                    ("BOX", (0, 0), (-1, -1), 1, colors.black),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ]
            )
        )
        elems.append(det_tbl)
        elems.append(Spacer(1, 12))

    # Footer --------------------------------------------------------
    elems.append(Spacer(1, 24))
    elems.append(
        Paragraph(
            f"Generated on {_dt.datetime.utcnow():%Y‑%m‑%d %H:%M:%S UTC}",
            styles["Normal"],
        )
    )

    doc.build(elems)
    buf.seek(0)
    return buf
