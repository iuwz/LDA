# backend/main.py
import logging
from datetime import datetime
from typing import Optional

import uvicorn
from bson import ObjectId
from fastapi import (
    Depends,
    FastAPI,
    File,
    HTTPException,
    Request,
    UploadFile,
)
from pydantic import BaseModel, EmailStr
from starlette.middleware.cors import CORSMiddleware

from app.core.database import init_db
from app.middleware.jwt_middleware import JWTMiddleware
from app.mvc.controllers.analysis import analyze_risk, get_risk_report
from app.mvc.controllers.rephrase import extract_full_text_from_stream
from app.mvc.controllers.documents import (
    upload_file_to_gridfs,
    store_document_record,
)
from app.mvc.models.user import UserInDB
from app.utils.security import (
    get_current_user,
    get_password_hash,
    verify_password,
)

# ─────────── Routers ───────────
from app.mvc.views.admin import router as admin_router
from app.mvc.views.auth import router as auth_router
from app.mvc.views.chatbot import router as chatbot_router
from app.mvc.views.compliance import router as compliance_router
from app.mvc.views.documents import router as documents_router
from app.mvc.views.rephrase import router as rephrase_router
from app.mvc.views.translate import router as translate_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)

# ─────────── Schemas ───────────
class RiskAnalysisInput(BaseModel):
    document_text: str


class UpdateMe(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    current_password: Optional[str] = None
    new_password: Optional[str] = None


# ─────────── App Factory ───────────
def create_app() -> FastAPI:
    app = FastAPI(title="Legal Document Analyzer (LDA)")

    # ── Startup: DB init ───────────────────────────────────────
    @app.on_event("startup")
    async def on_startup():
        await init_db(app)
        logging.info("Database initialized.")

    # ── Middleware (‼  CORS FIRST  ‼) ─────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"],
    )
    app.add_middleware(JWTMiddleware)  # inner layer

    # ── Include routers ────────────────────────────────────────
    app.include_router(auth_router, prefix="/auth", tags=["Auth"])
    app.include_router(documents_router, prefix="/documents", tags=["Documents"])
    app.include_router(compliance_router, prefix="/compliance", tags=["Compliance"])
    app.include_router(rephrase_router, prefix="/rephrase", tags=["Rephrase"])
    app.include_router(translate_router, prefix="/translate", tags=["Translation"])
    app.include_router(chatbot_router, prefix="/chatbot", tags=["Chatbot"])
    app.include_router(admin_router, prefix="/admin", tags=["Admin"])

    # ─────────── Auth helpers ───────────
    @app.get("/auth/me", tags=["Auth"])
    async def read_current_user(current_user: UserInDB = Depends(get_current_user)):
        return {
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "email": current_user.email,
            "role": current_user.role,
        }

    @app.patch("/auth/me", tags=["Auth"])
    async def update_current_user(
        input: UpdateMe,
        request: Request,
        current_user: UserInDB = Depends(get_current_user),
    ):
        db = request.app.state.db
        update_data = {
            "first_name": input.first_name,
            "last_name": input.last_name,
            "email": input.email,
        }
        if input.current_password or input.new_password:
            if not (input.current_password and input.new_password):
                raise HTTPException(
                    status_code=400,
                    detail="Both current and new passwords are required",
                )
            if not verify_password(
                input.current_password, current_user.hashed_password
            ):
                raise HTTPException(status_code=400, detail="Current password is incorrect")
            update_data["hashed_password"] = get_password_hash(input.new_password)

        result = await db["users"].update_one(
            {"_id": ObjectId(current_user.id)}, {"$set": update_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

        return {**update_data, "role": current_user.role}

    # ─────────── Risk assessment routes ───────────
    @app.post("/risk/analyze", tags=["Risk"])
    async def analyze_document_risk(input_data: RiskAnalysisInput, request: Request):
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")
        db = request.app.state.db
        result = await analyze_risk(
            input_data.document_text, user_id, db, filename=None
        )
        return {"analysis_result": result}

    @app.post("/risk/analyze-file", tags=["Risk"])
    async def analyze_document_file(request: Request, file: UploadFile = File(...)):
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")
        db = request.app.state.db

        raw = await file.read()

        class AsyncBytes:
            def __init__(self, b: bytes):
                self._b = b

            async def read(self) -> bytes:
                return self._b

        async_stream = AsyncBytes(raw)
        text = await extract_full_text_from_stream(async_stream, file.filename)
        if text.startswith("Error:"):
            raise HTTPException(status_code=422, detail=text)

        result = await analyze_risk(text, user_id, db, filename=file.filename)
        return {"analysis_result": result}

    # ---- upload jsPDF from the frontend ----------------------
    @app.post("/risk/{report_id}/upload-pdf", tags=["Risk"])
    async def upload_risk_pdf(
        report_id: str,
        request: Request,
        file: UploadFile = File(...),
    ):
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")

        db = request.app.state.db
        if not ObjectId.is_valid(report_id):
            raise HTTPException(status_code=400, detail="Invalid report id")

        row = await db["risk_assessments"].find_one({"_id": ObjectId(report_id)})
        if not row or row["user_id"] != user_id:
            raise HTTPException(status_code=404, detail="Not found")

        data = await file.read()
        grid_id = await upload_file_to_gridfs(db, data, file.filename)
        doc_id = await store_document_record(db, user_id, file.filename, grid_id)

        await db["risk_assessments"].update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"report_doc_id": doc_id, "report_filename": file.filename}},
        )
        return {"report_doc_id": doc_id, "filename": file.filename}

    # ---- History (keep BEFORE /risk/{id} ) -------------------
    @app.get("/risk/history", tags=["Risk"])
    async def list_my_risk_reports(request: Request):
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")

        db = request.app.state.db
        cursor = db["risk_assessments"].find({"user_id": user_id}).sort("_id", -1)
        items = []
        async for row in cursor:
            items.append(
                {
                    "id": str(row["_id"]),
                    "created_at": row.get("created_at", datetime.utcnow()),
                    "num_risks": len(row.get("risks", [])),
                    "origin": "file" if row.get("filename") else "text",
                    "filename": row.get("filename"),
                    "report_filename": row.get("report_filename"),
                    "report_doc_id": row.get("report_doc_id"),
                }
            )
        return {"history": items}

    @app.delete("/risk/{report_id}", tags=["Risk"])
    async def delete_risk_report(report_id: str, request: Request):
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")

        db = request.app.state.db
        if not ObjectId.is_valid(report_id):
            raise HTTPException(status_code=400, detail="Invalid report id")

        row = await db["risk_assessments"].find_one({"_id": ObjectId(report_id)})
        if not row or row["user_id"] != user_id:
            raise HTTPException(status_code=404, detail="Not found")

        await db["risk_assessments"].delete_one({"_id": ObjectId(report_id)})
        return {"ok": True}

    @app.get("/risk/{report_id}", tags=["Risk"])
    async def retrieve_risk_report(report_id: str, request: Request):
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")
        db = request.app.state.db

        report = await get_risk_report(report_id, db)
        if report.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied (not your report)")
        return {"risk_report": report}

    # ─────────── Root ───────────
    @app.get("/", tags=["Root"])
    async def root():
        return {"message": "Welcome to the LDA API"}

    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
