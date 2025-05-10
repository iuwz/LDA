from io import BytesIO
from typing import List, Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen.canvas import Canvas


def build_risk_pdf(risks: List[Dict[str, Any]], title: str) -> bytes:
    """
    Generate a multi-page PDF summarising the risks; return raw bytes.
    """
    buf = BytesIO()
    c = Canvas(buf, pagesize=letter)
    w, h = letter
    y = h - 50

    c.setFont("Helvetica-Bold", 16)
    c.drawString(40, y, title)
    y -= 30

    c.setFont("Helvetica", 10)
    for idx, r in enumerate(risks, 1):
        if y < 80:
            c.showPage()
            y = h - 50
            c.setFont("Helvetica-Bold", 16)
            c.drawString(40, y, title)
            y -= 30
            c.setFont("Helvetica", 10)

        c.drawString(40, y, f"{idx}. {r['section']} ({r['severity']})")
        y -= 12
        risk_desc = r['risk_description'][:95]  # Adjust length to avoid overflow
        c.drawString(60, y, risk_desc)
        y -= 18

    c.save()
    buf.seek(0)
    return buf.read()
