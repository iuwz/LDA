# main.py

import uvicorn
import logging
from fastapi import FastAPI, Body, Request, HTTPException
from starlette.middleware.cors import CORSMiddleware

# DB init function (must store MongoDB client in app.state.db or similar)
from app.core.database import init_db

# Your custom JWT middleware (sets request.state.user_id if valid)
from app.middleware.jwt_middleware import JWTMiddleware

# Existing Routers
from app.mvc.views.auth import router as auth_router
from app.mvc.views.documents import router as documents_router
from app.mvc.views.compliance import router as compliance_router
from app.mvc.views.rephrase import router as rephrase_router
from app.mvc.views.translate import router as translate_router
from app.mvc.views.chatbot import router as chatbot_router

# Import GPT-based risk analysis controllers
from app.mvc.controllers.analysis import analyze_risk, get_risk_report

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)

def create_app() -> FastAPI:
    app = FastAPI(title="LDA with Bearer Auth in Older FastAPI")

    @app.on_event("startup")
    async def on_startup():
        # Initialize MongoDB or other DB
        await init_db(app)
        logging.info("Database initialized.")

    # Add JWT Middleware for auth (valid token => request.state.user_id is set)
    app.add_middleware(JWTMiddleware)

    # (Optional) CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include other routers
    app.include_router(auth_router, prefix="/auth", tags=["Auth"])
    app.include_router(documents_router, prefix="/documents", tags=["Documents"])
    app.include_router(compliance_router, prefix="/compliance", tags=["Compliance"])
    app.include_router(rephrase_router, prefix="/rephrase", tags=["Rephrase"])
    app.include_router(translate_router, prefix="/translate", tags=["Translation"])
    app.include_router(chatbot_router, prefix="/chatbot", tags=["Chatbot"])

    # --------------------------------------------
    # RISK ANALYSIS ENDPOINTS
    # --------------------------------------------
    @app.post("/risk/analyze", tags=["Risk"])
    async def analyze_document(document_text: str = Body(...), request: Request = None):
        """
        Analyzes the provided legal document text for potential risks.

        - The user ID is taken from the JWT token (JWTMiddleware).
        - Only authenticated users can call this.
        - The resulting report is associated with the authenticated user.
        """
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            # If the middleware didn't set user_id, token is missing or invalid
            raise HTTPException(status_code=401, detail="Unauthorized or invalid token.")

        db = request.app.state.db
        result = await analyze_risk(document_text, user_id, db)
        return {"analysis_result": result}

    @app.get("/risk/{report_id}", tags=["Risk"])
    async def retrieve_risk_report(report_id: str, request: Request):
        """
        Retrieves a risk report by its MongoDB ObjectId.

        - Only the user who created the report (user_id) can access it.
        - Raises 403 if it doesn't belong to the current user.
        """
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized or invalid token.")

        db = request.app.state.db
        result = await get_risk_report(report_id, db)

        # Check ownership
        if result.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Forbidden: This report is not yours.")

        return {"risk_report": result}

    @app.get("/")
    async def root():
        return {"message": "Welcome to the LDA API"}

    return app

app = create_app()

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
