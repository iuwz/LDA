# backend/main.py

import uvicorn
import logging
from fastapi import FastAPI, Request, HTTPException, Depends
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.database import init_db
from app.middleware.jwt_middleware import JWTMiddleware
from app.utils.security import get_current_user
from app.mvc.models.user import UserInDB

# Import all your routers
from app.mvc.views.auth import router as auth_router
from app.mvc.views.documents import router as documents_router
from app.mvc.views.compliance import router as compliance_router # Imported compliance router
from app.mvc.views.rephrase import router as rephrase_router
from app.mvc.views.translate import router as translate_router
from app.mvc.views.chatbot import router as chatbot_router
from app.mvc.views.admin import router as admin_router

# Controllers for risk analysis (assuming these are separate endpoints not part of a router file yet)
# Make sure these exist in backend/app/mvc/controllers/analysis.py
from app.mvc.controllers.analysis import analyze_risk, get_risk_report

# Import compliance models (necessary for response_model in views/controllers, good practice to import here too)
from app.mvc.models import compliance as compliance_models


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)

# Assuming this is for the direct /risk/analyze endpoint in main.py
class RiskAnalysisInput(BaseModel):
    document_text: str


def create_app() -> FastAPI:
    app = FastAPI(title="Legal Document Analyzer (LDA)")

    @app.on_event("startup")
    async def on_startup():
        await init_db(app)
        logging.info("Database initialized.")

    # JWT Middleware
    app.add_middleware(JWTMiddleware)

    # CORS (allowing your Vite dev server)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"], # Make sure this matches your frontend URL
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount routers
    app.include_router(auth_router, prefix="/auth", tags=["Auth"])
    app.include_router(documents_router, prefix="/documents", tags=["Documents"])
    # Include the compliance router
    app.include_router(compliance_router, prefix="/compliance", tags=["Compliance"])
    app.include_router(rephrase_router, prefix="/rephrase", tags=["Rephrase"])
    app.include_router(translate_router, prefix="/translate", tags=["Translation"])
    app.include_router(chatbot_router, prefix="/chatbot", tags=["Chatbot"])
    # Admin router has its own prefix="/admin" (handled within admin_router file if it exists)
    app.include_router(admin_router, tags=["Admin"]) # Assuming admin_router is defined elsewhere


    # -------------------------------------------------------------------
    # Auth "me" endpoint for front-end session check
    # -------------------------------------------------------------------
    @app.get("/auth/me", tags=["Auth"])
    async def read_current_user(current_user: UserInDB = Depends(get_current_user)):
        # This endpoint is protected by JWTMiddleware + Depends(get_current_user)
        # It returns the user object if authenticated.
        return {"email": current_user.email, "role": current_user.role}

    # -------------------------------------------------------------------
    # Risk analysis endpoints (as provided by the user in main.py)
    # -------------------------------------------------------------------
    # NOTE: If Risk analysis has grown into multiple endpoints, consider
    # creating a separate router file (e.g., backend/app/mvc/views/risk.py)
    # and moving these endpoints there, then including risk_router here.
    @app.post("/risk/analyze", tags=["Risk"])
    async def analyze_document_risk(input_data: RiskAnalysisInput, request: Request):
        # Ensure user is authenticated by checking request.state.user_id
        # A more robust way for endpoints not using Depends(get_current_user)
        # is to perform the check explicitly like this.
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")

        db = request.app.state.db
        try:
             # Call the risk controller function
             result = await analyze_risk(input_data.document_text, user_id, db)
             # Assuming analyze_risk returns a dictionary like {"id": ..., "risks": [...]}
             return {"analysis_result": result}
        except HTTPException:
             raise # Re-raise FastAPI exceptions
        except Exception as e:
             logging.error(f"Risk analysis error: {e}", exc_info=True)
             raise HTTPException(status_code=500, detail="Internal server error during risk analysis")


    @app.get("/risk/{report_id}", tags=["Risk"])
    async def retrieve_risk_report(report_id: str, request: Request):
        # Ensure user is authenticated and is the owner
        # A more robust way for endpoints not using Depends(get_current_user)
        # is to perform the check explicitly like this.
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
             raise HTTPException(status_code=401, detail="Unauthorized")

        db = request.app.state.db
        try:
             # Call the risk controller function
             report = await get_risk_report(report_id, db)

             # Verify ownership (controller might already do this, but double check here)
             if report.get("user_id") != user_id:
                 raise HTTPException(status_code=403, detail="Access denied (not your report)")

             # Assuming get_risk_report returns the full report document
             return {"risk_report": report}
        except HTTPException:
             raise # Re-raise FastAPI exceptions
        except Exception as e:
             logging.error(f"Error retrieving risk report {report_id}: {e}", exc_info=True)
             raise HTTPException(status_code=500, detail="Internal server error retrieving risk report")


    # Health check
    @app.get("/", tags=["Root"])
    async def root():
        return {"message": "Welcome to the LDA API"}

    return app


app = create_app()

# This part runs the server when the script is executed directly
if __name__ == "__main__":
    # In a production environment, you might use a process manager like Gunicorn
    # uvicorn main:app --host 127.0.0.1 --port 8000 --reload
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)