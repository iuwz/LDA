# main.py

import uvicorn
import logging
from fastapi import FastAPI, Request, HTTPException
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Your DB init function (must set app.state.db or similar)
from app.core.database import init_db

# Your custom JWT middleware (sets request.state.user_id if token is valid)
from app.middleware.jwt_middleware import JWTMiddleware

# Existing Routers
from app.mvc.views.auth import router as auth_router
from app.mvc.views.documents import router as documents_router
from app.mvc.views.compliance import router as compliance_router
from app.mvc.views.rephrase import router as rephrase_router
from app.mvc.views.translate import router as translate_router
from app.mvc.views.chatbot import router as chatbot_router

# GPT-based risk analysis controllers
from app.mvc.controllers.analysis import analyze_risk, get_risk_report

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)

# -------------------------------------------------------------------
# 1) Pydantic Model for /risk/analyze Input
# -------------------------------------------------------------------
class RiskAnalysisInput(BaseModel):
    document_text: str

def create_app() -> FastAPI:
    app = FastAPI(title="LDA with Bearer Auth in Older FastAPI")

    @app.on_event("startup")
    async def on_startup():
        # Initialize MongoDB or other DB
        await init_db(app)
        logging.info("Database initialized.")

    # Add JWT Middleware for auth
    app.add_middleware(JWTMiddleware)

    # Optional: add CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # For testing, allow all
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include existing routers
    app.include_router(auth_router, prefix="/auth", tags=["Auth"])
    app.include_router(documents_router, prefix="/documents", tags=["Documents"])
    app.include_router(compliance_router, prefix="/compliance", tags=["Compliance"])
    app.include_router(rephrase_router, prefix="/rephrase", tags=["Rephrase"])
    app.include_router(translate_router, prefix="/translate", tags=["Translation"])
    app.include_router(chatbot_router, prefix="/chatbot", tags=["Chatbot"])

    # -------------------------------------------------------------------
    # 2) RISK ANALYSIS ENDPOINTS
    # -------------------------------------------------------------------
    @app.post("/risk/analyze", tags=["Risk"])
    async def analyze_document(input_data: RiskAnalysisInput, request: Request):
        """
        Analyzes the provided legal document text for potential risks.
        The user_id is taken from the JWT token, not from the body.

        Body JSON should look like:
        {
            "document_text": "Some contract text..."
        }
        """
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized or invalid token.")

        document_text = input_data.document_text
        db = request.app.state.db
        result = await analyze_risk(document_text, user_id, db)
        return {"analysis_result": result}

    @app.get("/risk/{report_id}", tags=["Risk"])
    async def retrieve_risk_report(report_id: str, request: Request):
        """
        Retrieves a risk report by its MongoDB ObjectId.
        Only the user who created that report may access it.
        """
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized or invalid token.")

        db = request.app.state.db
        report = await get_risk_report(report_id, db)

        # Check ownership
        if report.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Forbidden: This report is not yours.")

        return {"risk_report": report}

    @app.get("/")
    async def root():
        return {"message": "Welcome to the LDA API"}

    return app

app = create_app()

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
