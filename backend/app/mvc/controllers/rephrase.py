# backend/app/mvc/controllers/rephrase.py

import logging
import json
from fastapi import HTTPException
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from io import BytesIO
import os # Import os for path manipulation

# Import document-related controllers and views helpers
from app.mvc.controllers.documents import get_document_record, open_gridfs_file, store_document_record, upload_file_to_gridfs

# Import libraries for document processing (add these to requirements.txt)
try:
    from docx import Document as DocxDocument
    logger = logging.getLogger(__name__)
    logger.info("python-docx library found.")
except ImportError:
    DocxDocument = None
    logger = logging.getLogger(__name__)
    logger.warning("python-docx not installed. DOCX creation/reading unavailable.")

try:
    from PyPDF2 import PdfReader
    logger = logging.getLogger(__name__)
    logger.info("PyPDF2 library found for PDF reading.")
except ImportError:
    PdfReader = None
    logger = logging.getLogger(__name__)
    logger.warning("PyPDF2 not installed. PDF reading for rephrasing unavailable.")

# Import GPT helper
from app.core.openai_client import call_gpt

logger = logging.getLogger(__name__) # Ensure logger is defined here


# Helper function to extract ALL text from a document stream
async def extract_full_text_from_stream(stream, filename: str) -> str:
    """
    Attempts to extract all text content from a file stream.
    Requires python-docx and PyPDF2 libraries installed.
    """
    file_extension = filename.split('.')[-1].lower()
    text_content = ""

    try:
        # Read the entire stream content into memory
        content = await stream.read()
    except Exception as e:
        logger.error(f"Failed to read file stream for {filename}: {e}")
        return f"Error: Could not read file content for {filename}. {e}"

    if file_extension == 'docx' and DocxDocument:
        try:
            doc = DocxDocument(BytesIO(content))
            paragraphs = [p.text for p in doc.paragraphs]
            # You might need to handle tables, headers, footers, etc.
            # For this example, we'll focus on paragraphs.
            text_content = "\n".join(paragraphs)
            logger.info(f"Extracted text from DOCX: {filename}")
        except Exception as e:
            logger.error(f"Error extracting text from DOCX {filename}: {e}")
            text_content = f"Error: Could not extract text from DOCX file: {filename}. {e}"
    elif file_extension == 'pdf' and PdfReader:
        try:
            reader = PdfReader(BytesIO(content))
            if reader.is_encrypted:
                logger.warning(f"PDF file {filename} is encrypted, cannot extract text.")
                text_content = f"Error: PDF file {filename} is encrypted. Cannot extract text."
            else:
                text_content = ""
                for page_num in range(len(reader.pages)):
                    page = reader.pages[page_num]
                    text_content += page.extract_text() or ""
                logger.info(f"Extracted text from PDF: {filename}")
        except Exception as e:
            logger.error(f"Error extracting text from PDF {filename}: {e}")
            text_content = f"Error: Could not extract text from PDF file: {filename}. {e}"
    else:
        logger.warning(f"Unsupported file type for text extraction: {file_extension}")
        # Attempt to decode as plain text as a last resort
        try:
            text_content = content.decode('utf-8')
        except Exception:
            try:
                text_content = content.decode('latin-1')
            except Exception:
                text_content = f"Error: Unsupported file format or text decoding failed for {filename}."
                logger.error(text_content)


    return text_content

# Helper function to create a basic DOCX from text
def create_simple_docx_from_text(text_content: str) -> bytes:
    """
    Creates a simple DOCX document containing the given text content.
    Requires python-docx installed.
    """
    if not DocxDocument:
        logger.error("python-docx not available, cannot create DOCX.")
        raise Exception("DOCX creation library not available.")

    document = DocxDocument()
    # Add paragraphs, splitting by new lines
    for paragraph_text in text_content.split('\n'):
        document.add_paragraph(paragraph_text)

    # Save the document to a BytesIO stream
    byte_stream = BytesIO()
    document.save(byte_stream)
    byte_stream.seek(0) # Rewind the stream

    return byte_stream.getvalue()


# Update the function signature
async def run_rephrase_tool(
    db: AsyncIOMotorDatabase,
    user_id: str,
    style: str,
    document_text: str = None,
    doc_id: str = None
):
    """
    Rephrases the given text content or the text from a document.
    If document_text is provided, rephrases text directly.
    If doc_id is provided, extracts text from the document, rephrases it,
    and creates a new document (DOCX) with the rephrased text.
    Stores a rephrase report regardless.
    Returns:
      If text rephrasing: {"report_id": str, "rephrased_text": str}
      If document rephrasing: {"report_id": str, "rephrased_doc_id": str, "rephrased_doc_filename": str}
      Raises HTTPException on failure.
    """

    if document_text is None and doc_id is None:
        raise HTTPException(status_code=400, detail="Either document_text or doc_id must be provided.")
    if document_text is not None and doc_id is not None:
         raise HTTPException(status_code=400, detail="Only one of document_text or doc_id should be provided.")


    logger.info(f"Starting rephrase for user_id={user_id} with style={style}")

    original_content_info_for_report = ""
    final_rephrased_output_summary_for_report = ""

    rephrased_doc_id = None
    rephrased_doc_filename = None # This needs to be assigned the new filename
    rephrased_text_output = None # For text rephrasing
    report_id = None # Initialize report_id

    try:
        if doc_id:
            logger.info(f"Handling document rephrasing for doc_id={doc_id} with style={style}")

            # 1. Fetch the original document record and file content
            record = await get_document_record(db, doc_id)
            grid_out, original_filename = await open_gridfs_file(db, record["file_id"])
            original_content_info_for_report = f"Content from document ID: {doc_id}, Original Filename: {original_filename}"

            # 2. Extract ALL text from the document
            extracted_text = await extract_full_text_from_stream(grid_out, original_filename)

            if extracted_text.startswith("Error:"):
                # If extraction failed with a known error message, raise 422
                raise HTTPException(status_code=422, detail=extracted_text)

            # 3. Send extracted text to AI for rephrasing
            # NOTE: For very large documents, you will need to split 'extracted_text'
            # into smaller chunks that fit within the AI model's token limit,
            # call the AI for each chunk, and then combine the rephrased chunks.
            logger.info(f"Sending extracted text to AI (length: {len(extracted_text)})...")

            system_message = (
                "You are a legal rewriting AI. You rephrase the given text for better clarity "
                f"and correctness, while preserving its original meaning. Rephrase it in a {style} style. "
                "Return ONLY the rephrased text, without any extra formatting or JSON."
            )
            user_prompt = f"Text to rephrase:\n{extracted_text}"

            rephrased_text_from_ai = None
            try:
                # Call the AI. Consider chunking here for long texts.
                gpt_response = call_gpt(
                    prompt=user_prompt,
                    system_message=system_message,
                    temperature=0.4
                )
                if gpt_response:
                    # Assuming AI returns plain text now based on system message
                    rephrased_text_from_ai = gpt_response.strip()
                    logger.info("Received rephrased text from AI.")
                else:
                    logger.warning("AI returned no response for document text.")
            except Exception as ai_error:
                logger.error(f"AI rephrasing failed for document text: {ai_error}", exc_info=True)
                rephrased_text_from_ai = extracted_text # Fallback to original text on AI error
                final_rephrased_output_summary_for_report = "AI rephrasing failed. Original text used."


            if not rephrased_text_from_ai:
                 # If AI failed and fallback wasn't set, use a message
                 rephrased_text_from_ai = "Could not rephrase document text."
                 final_rephrased_output_summary_for_report = rephrased_text_from_ai


            # 4. Create a NEW DOCX document with the rephrased text
            if DocxDocument:
                logger.info("Creating new DOCX document with rephrased text.")
                try:
                    reconstructed_document_bytes = create_simple_docx_from_text(rephrased_text_from_ai)
                    base_filename, _ = os.path.splitext(original_filename)
                    new_filename = f"{base_filename}_rephrased.docx"
                    final_rephrased_output_summary_for_report = f"Rephrased text placed in new DOCX: {new_filename}"

                except Exception as doc_create_error:
                    logger.error(f"Error creating DOCX document: {doc_create_error}", exc_info=True)
                    # Catch the specific error and re-raise as HTTPException
                    raise HTTPException(status_code=500, detail=f"Failed to create rephrased DOCX document: {doc_create_error}")
            else:
                 # Cannot create DOCX, raise an error
                 logger.error("python-docx not available. Cannot create DOCX.")
                 raise HTTPException(status_code=500, detail="Server error: Document creation library (python-docx) not available.")


            # 5. Store the NEW rephrased document in GridFS
            try:
                rephrased_file_id = await upload_file_to_gridfs(db, reconstructed_document_bytes, new_filename)
            except Exception as upload_error:
                 logger.error(f"Error uploading rephrased document to GridFS: {upload_error}", exc_info=True)
                 # Catch the specific error and re-raise as HTTPException
                 raise HTTPException(status_code=500, detail=f"Failed to store rephrased document file: {upload_error}")


            # 6. Store a new document record for the rephrased document
            try:
                rephrased_doc_id = await store_document_record(db, user_id, new_filename, rephrased_file_id)
                # --- FIX: Assign new_filename to rephrased_doc_filename ---
                rephrased_doc_filename = new_filename
            except Exception as record_error:
                 logger.error(f"Error storing rephrased document record in DB: {record_error}", exc_info=True)
                 # Catch the specific error and re-raise as HTTPException
                 # Note: The GridFS file might exist even if the record fails. Cleanup might be needed in a robust system.
                 raise HTTPException(status_code=500, detail=f"Failed to store rephrased document record: {record_error}")

            logger.info(f"New rephrased document stored with ID: {rephrased_doc_id}, Filename: {rephrased_doc_filename}") # Use rephrased_doc_filename here

            # ────────────────────────────────────────────────────────────────------
            # Store Rephrase Report (Unified) - Moved this block BEFORE returning
            # ────────────────────────────────────────────────────────────────------
            rephrase_record = {
                "user_id": user_id,
                "original_content_info": original_content_info_for_report,
                "rephrased_output_summary": final_rephrased_output_summary_for_report,
                "style": style,
                "original_doc_id": doc_id,
                "rephrased_doc_id": rephrased_doc_id # Will be None for text rephrasing
            }

            try:
                result = await db.rephrase_reports.insert_one(rephrase_record)
                report_id = str(result.inserted_id) # report_id is assigned here
                logger.info(f"Rephrase report stored with ID: {report_id}")
            except Exception as e:
                logger.error(f"Error inserting rephrase report: {e}", exc_info=True)
                # Decide how critical report storage is. If crucial, raise error.
                # Given the flow, if report storage fails, the operation might be
                # considered partially failed, but we might still want to return
                # the rephrased doc info if it was stored successfully.
                # For now, log and continue, but report_id might be None if storage failed.
                # The view will need to handle report_id possibly being null.
                pass # Allow the view to handle the final response if report_id is None


            # --- ADDED LOGGING HERE ---
            # This log statement now comes AFTER report_id is assigned
            # Use the assigned rephrased_doc_filename
            logger.info(f"Controller preparing to return document details: report_id={report_id}, rephrased_doc_id={rephrased_doc_id}, rephrased_doc_filename={rephrased_doc_filename}")

            # Return the dictionary that the view expects
            # Ensure report_id is always included, even if it's None due to storage failure
            return {
                "report_id": report_id, # Now defined above
                "rephrased_doc_id": rephrased_doc_id,
                "rephrased_doc_filename": rephrased_doc_filename # Now correctly assigned
            }


        elif document_text is not None:
            logger.info("Handling text rephrasing")
            # ──────────────────────────────────────────────────────────────────
            # TEXT REPHRASING LOGIC (Existing)
            # ──────────────────────────────────────────────────────────────────
            original_content_info_for_report = document_text

            system_message = (
                "You are a legal rewriting AI. You rephrase the given text for better clarity "
                f"and correctness, while preserving its original meaning. Rephrase it in a {style} style. "
                "Return valid JSON ONLY, in the format:\n"
                "{\n"
                "  \"rephrased_text\": \"...\"\n"
                "}\n"
                "Do not include any additional keys or text."
            )

            user_prompt = f"Text to rephrase:\n{document_text}"

            rephrased_text = None
            try:
                gpt_response = call_gpt(
                    prompt=user_prompt,
                    system_message=system_message,
                    temperature=0.4
                )

                if gpt_response:
                    try:
                        parsed = json.loads(gpt_response)
                        if "rephrased_text" in parsed:
                            rephrased_text = parsed["rephrased_text"].strip()
                            logger.info("Successfully parsed GPT rephrased text.")
                        else:
                            logger.warning("GPT response does not contain 'rephrased_text'. Using fallback logic.")
                    except json.JSONDecodeError as e:
                        logger.warning(f"Failed to parse GPT rephrase response as JSON: {e}. Using fallback logic.")
                else:
                    logger.warning("GPT call returned no response. Using fallback logic.")
            except Exception as e:
                 logger.error(f"Error calling GPT for rephrase: {e}", exc_info=True)
                 logger.warning("GPT call failed. Using fallback logic.")

            # Fallback logic for text rephrasing
            if not rephrased_text:
                rephrased_text = f"[{style.upper()} REPHRASED]: {document_text}"
                logger.info("Using fallback rephrased text.")

            rephrased_text_output = rephrased_text
            final_rephrased_output_summary_for_report = rephrased_text_output

            # ────────────────────────────────────────────────────────────────------
            # Store Rephrase Report (Unified) - Moved this block BEFORE returning
            # ────────────────────────────────────────────────────────────────------
            rephrase_record = {
                "user_id": user_id,
                "original_content_info": original_content_info_for_report,
                "rephrased_output_summary": final_rephrased_output_summary_for_report,
                "style": style,
                "original_doc_id": doc_id, # Will be None for text rephrasing
                "rephrased_doc_id": rephrased_doc_id # Will be None for text rephrasing
            }

            try:
                result = await db.rephrase_reports.insert_one(rephrase_record)
                report_id = str(result.inserted_id) # report_id is assigned here
                logger.info(f"Rephrase report stored with ID: {report_id}")
            except Exception as e:
                logger.error(f"Error inserting rephrase report: {e}", exc_info=True)
                pass # Log and continue


            # --- ADDED LOGGING HERE ---
            # This log statement now comes AFTER report_id is assigned
            logger.info(f"Controller preparing to return text details: report_id={report_id}, rephrased_text={rephrased_text_output[:100]}...")


            # Return the dictionary that the view expects
            # Ensure report_id is always included, even if it's None due to storage failure
            return {
                "report_id": report_id, # Now defined above
                "rephrased_text": rephrased_text_output
            }
            # ──────────────────────────────────────────────────────────────────
            # END TEXT REPHRASING LOGIC
            # ──────────────────────────────────────────────────────────────────


        # If execution reaches here without returning, it's an error state not
        # caught by the initial validation or specific error handling.
        logger.error("run_rephrase_tool reached end unexpectedly without returning.")
        # Ensure report_id is initialized even if this path is reached due to logic error
        if report_id is None:
             # Try to store a basic error report if nothing else worked
             try:
                 error_report = {
                     "user_id": user_id,
                     "original_content_info": original_content_info_for_report or "Unknown",
                     "rephrased_output_summary": "Error: Reaching unexpected end of rephrase logic.",
                     "style": style,
                     "original_doc_id": doc_id,
                     "rephrased_doc_id": None
                 }
                 insert_result = await db.rephrase_reports.insert_one(error_report)
                 report_id = str(insert_result.inserted_id)
                 logger.error(f"Stored error report with ID: {report_id}")
             except Exception as report_error:
                  logger.error(f"Failed to store final error report: {report_error}")
                  # report_id remains None if error report storage also failed


        raise HTTPException(status_code=500, detail="Internal server error: Rephrasing logic incomplete.")


    except HTTPException:
        # Re-raise any HTTPException originating within this controller
        raise
    except Exception as e:
         # Catch any other unhandled exceptions in the controller
         # Ensure report_id is included in the final error detail if possible
         error_detail = f"An unhandled error occurred in run_rephrase_tool: {e}"
         if report_id:
             error_detail += f" (Report ID: {report_id})"
         logger.error(f"An unhandled error occurred in run_rephrase_tool: {e}", exc_info=True)
         raise HTTPException(status_code=500, detail=error_detail)

# Keep the get_rephrase_report function if needed for fetching text reports.
# async def get_rephrase_report(db: AsyncIOMotorDatabase, report_id: str, user_id: str):
#     ...