# backend/main.py

import uvicorn
import logging
from fastapi import FastAPI, Request, HTTPException
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.database import init_db
from app.middleware.jwt_middleware import JWTMiddleware

# Your existing routers
from app.mvc.views.auth import router as auth_router
from app.mvc.views.documents import router as documents_router
from app.mvc.views.compliance import router as compliance_router
from app.mvc.views.rephrase import router as rephrase_router
from app.mvc.views.translate import router as translate_router
from app.mvc.views.chatbot import router as chatbot_router

# Admin router (already has prefix="/admin" inside admin.py)
from app.mvc.views.admin import router as admin_router

# Risk controllers
from app.mvc.controllers.analysis import analyze_risk, get_risk_report

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)

class RiskAnalysisInput(BaseModel):
    document_text: str


def create_app() -> FastAPI:
    app = FastAPI(title="Legal Document Analyzer (LDA)")

    @app.on_event("startup")
    async def on_startup():
        await init_db(app)
        logging.info("Database initialized.")

    # JWT + CORS
    app.add_middleware(JWTMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], allow_credentials=True,
        allow_methods=["*"], allow_headers=["*"],
    )

    # Mount your routers
    app.include_router(auth_router, prefix="/auth", tags=["Auth"])
    app.include_router(documents_router, prefix="/documents", tags=["Documents"])
    app.include_router(compliance_router, prefix="/compliance", tags=["Compliance"])
    app.include_router(rephrase_router, prefix="/rephrase", tags=["Rephrase"])
    app.include_router(translate_router, prefix="/translate", tags=["Translation"])
    app.include_router(chatbot_router, prefix="/chatbot", tags=["Chatbot"])

    # **Admin router already has its own prefix**, so no extra prefix here**
    app.include_router(admin_router, tags=["Admin"])

    #----------------------------------------------------------------------#
    # Risk endpoints
    #----------------------------------------------------------------------#
    @app.post("/risk/analyze", tags=["Risk"])
    async def analyze_document(input_data: RiskAnalysisInput, request: Request):
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")
        db = request.app.state.db
        result = await analyze_risk(input_data.document_text, user_id, db)
        return {"analysis_result": result}

    @app.get("/risk/{report_id}", tags=["Risk"])
    async def retrieve_risk_report(report_id: str, request: Request):
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")
        db = request.app.state.db
        report = await get_risk_report(report_id, db)
        if report.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        return {"risk_report": report}

    @app.get("/")
    async def root():
        return {"message": "Welcome to the LDA API"}

    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
