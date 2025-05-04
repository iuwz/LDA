import logging
import re
from fastapi import HTTPException, UploadFile
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.openai_client import call_gpt
from app.mvc.controllers.rephrase import extract_full_text_from_stream
from docx import Document
from io import BytesIO
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
from docx.shared import Pt, Inches

load_dotenv()
logger = logging.getLogger(__name__)

async def run_translation_tool(
    db: AsyncIOMotorDatabase,
    document_text: str,
    target_lang: str,
    user_id: str
):
    if not document_text:
        raise HTTPException(status_code=400, detail="Document text is required for translation")
    if not target_lang:
        raise HTTPException(status_code=400, detail="Target language is missing")

    logger.info(f"Translating text for user_id={user_id} into {target_lang}")

    system_message = f"You are a professional legal translator. Translate into {target_lang.upper()}."
    user_message = f"Translate this legal document into {target_lang.upper()}:\n\n{document_text}"

    try:
        translated_text = call_gpt(
            prompt=user_message,
            system_message=system_message,
            temperature=0.0
        )
        if not translated_text:
            raise Exception("Translation response was empty")
    except Exception as e:
        logger.error(f"Error during translation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Translation failed due to an internal error")

    record = {
        "user_id": user_id,
        "original_text": document_text,
        "target_lang": target_lang,
        "translated_text": translated_text,
    }
    result = await db.translation_reports.insert_one(record)
    logger.info(f"Stored translation record with _id={result.inserted_id}")

    return {
        "report_id": str(result.inserted_id),
        "translated_text": translated_text
    }

async def run_file_translation_tool(
    db: AsyncIOMotorDatabase,
    file: UploadFile,
    target_lang: str,
    user_id: str
):
    # Read and extract text
    raw = await file.read()
    class AsyncBytesIO:
        def __init__(self, content: bytes):
            self._content = content
        async def read(self):
            return self._content
    async_stream = AsyncBytesIO(raw)
    extracted_text = await extract_full_text_from_stream(async_stream, file.filename)
    if extracted_text.startswith("Error:"):
        raise HTTPException(status_code=422, detail=extracted_text)

    translation_result = await run_translation_tool(
        db=db,
        document_text=extracted_text,
        target_lang=target_lang,
        user_id=user_id
    )
    translated_content = translation_result["translated_text"]

    # Create DOCX document
    doc = Document()
    # Set margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Configure Normal style
    normal_style = doc.styles["Normal"]
    normal_style.font.name = "Arial"
    normal_style.font.size = Pt(12)

    # Add Title
    title = doc.add_heading("Translated Document", level=0)
    title.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    title.runs[0].font.name = "Arial"
    title.runs[0].font.size = Pt(16)

    # Add horizontal break
    doc.add_paragraph().add_run().add_break()

    # Process each non-empty line, strip markdown stars
    for line in translated_content.splitlines():
        raw_text = line.strip()
        if not raw_text:
            continue
        # Remove all asterisks
        clean = raw_text.replace("**", "").strip()
        if not clean:
            continue
        # Check for numbered heading (e.g., "1. Heading")
        m = re.match(r"^(\d+)\.\s*(.+)", clean)
        if m:
            number, heading_text = m.groups()
            # Build RTL numbered heading: text then number
            p = doc.add_paragraph()
            p.alignment = WD_PARAGRAPH_ALIGNMENT.RIGHT
            # Heading text
            run_heading = p.add_run(f"{heading_text} ")
            run_heading.font.name = "Arial"
            run_heading.font.size = Pt(14)
            run_heading.bold = True
            # Number run
            run_number = p.add_run(f"{number}.")
            run_number.font.name = "Arial"
            run_number.font.size = Pt(14)
            run_number.bold = True
            p.paragraph_format.space_after = Pt(6)
        else:
            # Plain paragraph
            p = doc.add_paragraph(clean)
            p.alignment = WD_PARAGRAPH_ALIGNMENT.RIGHT
            run = p.runs[0]
            run.font.name = "Arial"
            run.font.size = Pt(12)
            p.paragraph_format.space_after = Pt(6)

    # Save to buffer
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    translated_filename = f"translated_{file.filename.rsplit('.', 1)[0]}_{target_lang.lower()}.docx"
    return buffer.getvalue(), translated_filename
