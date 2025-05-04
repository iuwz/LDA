# backend/app/mvc/controllers/compliance.py

import logging
import json
import datetime
import re
from io import BytesIO
from typing import List, Dict, Any, Optional
from textwrap import wrap

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from docx import Document
from docx.shared import Pt
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

from app.core.openai_client import call_gpt
from app.mvc.controllers.documents import (
    get_document_record,
    open_gridfs_file,
    extract_full_text_from_stream,
)
from app.mvc.models.compliance import ComplianceIssue

logger = logging.getLogger(__name__)

# ─── Fallback rules ─────────────────────────────────────────────────────────
MOCK_RULES = [
    {"rule_id": "R1",  "pattern": "Confidential",        "description": "Document marked confidential requires an NDA clause"},
    {"rule_id": "R2",  "pattern": "Penalty",             "description": "Check if penalty exceeds legal limit"},
    {"rule_id": "R3",  "pattern": "Jurisdiction",        "description": "Ensure governing law and jurisdiction clauses are present"},
    {"rule_id": "R4",  "pattern": "indefinitely",        "description": "Data retention period must be finite and clearly defined."},
    {"rule_id": "R5",  "pattern": "sub[- ]processors",   "description": "Usage of Sub-processors must be limited and disclosed."},
    {"rule_id": "R6",  "pattern": "legitimate interests","description": "Legitimate interests as lawful basis requires balancing test."},
    {"rule_id": "R7",  "pattern": "any country",         "description": "International transfers need safeguards (e.g., SCCs)."},
    {"rule_id": "R8",  "pattern": "Data Subjects",       "description": "Processor must assist with Data Subject rights by law."},
    {"rule_id": "R9",  "pattern": "indirect",            "description": "Unlimited exclusion of liability is unenforceable."},
    {"rule_id": "R10", "pattern": "arbitration",         "description": "Arbitration location must be specified and fair."},
]

def extract_snippet(text: str, pattern: str, window_size: int = 100) -> str:
    """Return a snippet of text around the first match of pattern."""
    m = re.search(re.escape(pattern), text, re.IGNORECASE)
    if not m:
        return f"(snippet for '{pattern}' not found)"
    start, end = m.span()
    s = max(0, start - window_size)
    e = min(len(text), end + window_size)
    snippet = text[s:e]
    if s > 0:
        snippet = "…" + snippet
    if e < len(text):
        snippet = snippet + "…"
    return snippet

# ─── Core compliance check ────────────────────────────────────────────────────
async def run_compliance_check(
    db: AsyncIOMotorDatabase,
    user_id: str,
    document_text: str = None,
    doc_id: str = None
) -> Dict[str, Any]:
    if not (document_text or doc_id):
        raise HTTPException(400, "Either document_text or doc_id must be provided.")
    if document_text and doc_id:
        raise HTTPException(400, "Provide only one of document_text or doc_id.")

    # Load text if doc_id provided
    if doc_id:
        record = await get_document_record(db, doc_id)
        stream, filename = await open_gridfs_file(db, record["file_id"])
        document_text = await extract_full_text_from_stream(stream, filename)
        if document_text.startswith("Error"):
            raise HTTPException(422, document_text)

    # GPT-based analysis
    gpt_issues: List[Dict[str, Any]] = []
    use_fallback = True
    try:
        sys_msg = (
            "You are a compliance AI assistant. Identify issues in the text, "
            "return JSON {'issues': [...]}, each with 'rule_id','description','status',"
            " and 'extracted_text_snippet'."
        )
        resp = call_gpt(prompt=document_text, system_message=sys_msg, temperature=0.2)
        parsed = json.loads(resp)
        if isinstance(parsed.get("issues"), list):
            for item in parsed["issues"]:
                try:
                    ci = ComplianceIssue(**item)
                    gpt_issues.append(ci.model_dump())
                except:
                    continue
            if gpt_issues:
                use_fallback = False
    except:
        use_fallback = True

    # Build final_issues
    final_issues: List[Dict[str, Any]] = []
    if use_fallback:
        for rule in MOCK_RULES:
            if rule["pattern"].lower() in document_text.lower():
                snippet = extract_snippet(document_text, rule["pattern"])
                final_issues.append({
                    "rule_id": rule["rule_id"],
                    "description": rule["description"],
                    "status": "Issue Found",
                    "extracted_text_snippet": snippet
                })
        if not final_issues:
            final_issues.append({
                "rule_id": "None",
                "description": "No compliance issues detected by basic scan.",
                "status": "OK",
                "extracted_text_snippet": None
            })
    else:
        final_issues = gpt_issues

    # Store report
    preview = (document_text[:500] + "...") if len(document_text) > 500 else document_text
    report = {
        "user_id": user_id,
        "document_text_preview": preview,
        "original_doc_id": doc_id,
        "issues": final_issues,
        "timestamp": datetime.datetime.utcnow()
    }
    res = await db.compliance_reports.insert_one(report)

    return {"report_id": str(res.inserted_id), "issues": final_issues}

# ─── Fetch stored report ─────────────────────────────────────────────────────
async def get_compliance_report(
    db: AsyncIOMotorDatabase,
    report_id: str,
    user_id: str
) -> Dict[str, Any]:
    if not ObjectId.is_valid(report_id):
        raise HTTPException(400, "Invalid report ID.")
    doc = await db.compliance_reports.find_one({"_id": ObjectId(report_id), "user_id": user_id})
    if not doc:
        raise HTTPException(404, "Report not found or access denied.")
    doc["_id"] = str(doc["_id"])
    return doc

# ─── DOCX generator ──────────────────────────────────────────────────────────
def generate_compliance_report_docx(report_data: Dict[str, Any]) -> BytesIO:
    buffer = BytesIO()
    document = Document()

    # Cover page
    document.add_heading("Compliance Report", level=0)
    meta = document.add_table(rows=4, cols=2)
    meta.style = 'Light List Accent 1'
    meta.cell(0,0).text = "Report ID:"
    meta.cell(0,1).text = report_data.get("_id", "N/A")
    ts = report_data.get("timestamp")
    meta.cell(1,0).text = "Generated At:"
    meta.cell(1,1).text = ts.strftime('%Y-%m-%d %H:%M:%S UTC') if ts else "N/A"
    meta.cell(2,0).text = "User:"
    meta.cell(2,1).text = report_data.get("user_id", "N/A")
    meta.cell(3,0).text = "Document:"
    meta.cell(3,1).text = report_data.get("original_doc_id", "N/A")
    document.add_page_break()

    # Summary
    document.add_heading("1. Summary of Findings", level=1)
    counts = {"Compliant":0, "Non-Compliant":0, "Warning":0, "Unknown":0}
    for issue in report_data["issues"]:
        st = issue["status"].lower()
        if st == "ok": counts["Compliant"] += 1
        elif st == "issue found": counts["Non-Compliant"] += 1
        elif st == "warning": counts["Warning"] += 1
        else: counts["Unknown"] += 1

    tbl = document.add_table(rows=1, cols=5)
    hdr = tbl.rows[0].cells
    hdr[0].text, hdr[1].text, hdr[2].text, hdr[3].text, hdr[4].text = (
        "Total Issues", "Compliant", "Non-Compliant", "Warning", "Unknown"
    )
    row = tbl.add_row().cells
    row[0].text = str(len(report_data["issues"]))
    row[1].text = str(counts["Compliant"])
    row[2].text = str(counts["Non-Compliant"])
    row[3].text = str(counts["Warning"])
    row[4].text = str(counts["Unknown"])
    document.add_page_break()

    # Detailed issues
    document.add_heading("2. Detailed Issues", level=1)
    for idx, issue in enumerate(report_data["issues"], start=1):
        document.add_heading(f"Issue {idx}", level=2)
        t = document.add_table(rows=4, cols=2)
        t.style = 'Light Grid Accent 2'
        t.cell(0,0).text, t.cell(0,1).text = "Rule ID", issue.get("rule_id","")
        t.cell(1,0).text, t.cell(1,1).text = "Status", issue.get("status","")
        t.cell(2,0).text, t.cell(2,1).text = "Description", issue.get("description","")
        snippet = issue.get("extracted_text_snippet") or "–"
        t.cell(3,0).text, t.cell(3,1).text = "Relevant Snippet", snippet
        document.add_paragraph("")

    # Footer
    footer = document.sections[-1].footer
    p = footer.paragraphs[0]
    p.text = f"Generated on {datetime.datetime.utcnow():%Y-%m-%d %H:%M:%S UTC}"
    p.alignment = 1

    document.save(buffer)
    buffer.seek(0)
    return buffer

# ─── PDF generator ───────────────────────────────────────────────────────────
def generate_compliance_report_pdf(report_data: Dict[str, Any]) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elems = []

    # Title and metadata
    elems.append(Paragraph("Compliance Report", styles["Title"]))
    elems.append(Spacer(1, 12))
    meta_data = [
        ["Report ID:", report_data.get("_id","N/A")],
        ["Generated At:", report_data.get("timestamp").strftime("%Y-%m-%d %H:%M:%S UTC") if report_data.get("timestamp") else "N/A"],
        ["User:", report_data.get("user_id","N/A")],
        ["Document:", report_data.get("original_doc_id","N/A")],
    ]
    meta_tbl = Table(meta_data, colWidths=[100, 350])
    meta_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.lightgrey),
        ("BOX", (0,0), (-1,-1), 1, colors.black),
        ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
    ]))
    elems.append(meta_tbl)
    elems.append(Spacer(1, 24))

    # Summary
    elems.append(Paragraph("1. Summary of Findings", styles["Heading2"]))
    counts = {"Compliant":0, "Non-Compliant":0, "Warning":0, "Unknown":0}
    for issue in report_data["issues"]:
        st = issue["status"].lower()
        if st == "ok": counts["Compliant"] += 1
        elif st == "issue found": counts["Non-Compliant"] += 1
        elif st == "warning": counts["Warning"] += 1
        else: counts["Unknown"] += 1
    summary_data = [
        ["Total Issues", "Compliant", "Non-Compliant", "Warning", "Unknown"],
        [str(len(report_data["issues"])),
         str(counts["Compliant"]),
         str(counts["Non-Compliant"]),
         str(counts["Warning"]),
         str(counts["Unknown"])],
    ]
    sum_tbl = Table(summary_data, colWidths=[80]*5)
    sum_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.lightblue),
        ("BOX", (0,0), (-1,-1), 1, colors.black),
        ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
    ]))
    elems.append(sum_tbl)
    elems.append(Spacer(1, 24))

    # Detailed issues
    elems.append(Paragraph("2. Detailed Issues", styles["Heading2"]))
    for idx, issue in enumerate(report_data["issues"], 1):
        elems.append(Paragraph(f"Issue {idx}: {issue.get('description')}", styles["Heading3"]))
        details = [
            ["Rule ID", issue.get("rule_id","")],
            ["Status", issue.get("status","")],
            ["Description", issue.get("description","")],
            ["Relevant Snippet", issue.get("extracted_text_snippet") or "–"],
        ]
        det_tbl = Table(details, colWidths=[100, 350])
        det_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.whitesmoke),
            ("BOX", (0,0), (-1,-1), 1, colors.black),
            ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
        ]))
        elems.append(det_tbl)
        elems.append(Spacer(1, 12))

    # Footer
    elems.append(Spacer(1, 24))
    elems.append(Paragraph(f"Generated on {datetime.datetime.utcnow():%Y-%m-%d %H:%M:%S UTC}", styles["Normal"]))

    doc.build(elems)
    buffer.seek(0)
    return buffer
