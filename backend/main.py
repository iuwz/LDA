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

from backend.app.core.database import init_db
from backend.app.middleware.jwt_middleware import JWTMiddleware
from backend.app.mvc.models.user import UserInDB
from backend.app.utils.security import get_current_user, get_password_hash, verify_password

# Routers
from backend.app.mvc.views.admin import router as admin_router
from backend.app.mvc.views.auth import router as auth_router
from backend.app.mvc.views.chatbot import router as chatbot_router
from backend.app.mvc.views.compliance import router as compliance_router
from backend.app.mvc.views.documents import router as documents_router
from backend.app.mvc.views.rephrase import router as rephrase_router
from backend.app.mvc.views.translate import router as translate_router
from backend.app.mvc.views.analysis import router as analysis_router  # <-- ADD THIS

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)

class UpdateMe(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    current_password: Optional[str] = None
    new_password: Optional[str] = None

def create_app() -> FastAPI:
    app = FastAPI(title="Legal Document Analyzer (LDA)")

# JWT Middleware
    app.add_middleware(JWTMiddleware)

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://lda-legal.com",
            "https://www.lda-legal.com",
            "https://api.lda-legal.com",
            "https://lda-new-backend.onrender.com",
            "https://lda-1-dcto.onrender.com"
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"],
    )

    

    @app.on_event("startup")
    async def on_startup():
        await init_db(app)
        logging.info("Database initialized.")

    # Routers
    app.include_router(auth_router, prefix="/auth", tags=["Auth"])
    app.include_router(documents_router, prefix="/documents", tags=["Documents"])
    app.include_router(compliance_router, prefix="/compliance", tags=["Compliance"])
    app.include_router(rephrase_router, prefix="/rephrase", tags=["Rephrase"])
    app.include_router(translate_router, prefix="/translate", tags=["Translation"])
    app.include_router(chatbot_router, prefix="/chatbot", tags=["Chatbot"])
    app.include_router(admin_router, prefix="/admin", tags=["Admin"])
    app.include_router(analysis_router, prefix="/risk", tags=["Risk"])  # <-- FIXED: Register risk analysis endpoints

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
                raise HTTPException(status_code=400, detail="Both current and new passwords are required")

            if not verify_password(input.current_password, current_user.hashed_password):
                raise HTTPException(status_code=400, detail="Current password is incorrect")

            update_data["hashed_password"] = get_password_hash(input.new_password)

        result = await db["users"].update_one(
            {"_id": ObjectId(current_user.id)}, {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

        return {**update_data, "role": current_user.role}

    @app.get("/", tags=["Root"])
    async def root():
        return {"message": "Welcome to the LDA API"}

    return app

app = create_app()

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)