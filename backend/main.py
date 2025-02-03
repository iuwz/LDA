# main.py

import uvicorn
import logging
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

# Example: Your DB init function (optional)
from app.core.database import init_db

# Your custom JWT middleware
from app.middleware.jwt_middleware import JWTMiddleware

# Routers
from app.mvc.views.auth import router as auth_router
from app.mvc.views.documents import router as documents_router
from app.mvc.views.compliance import router as compliance_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)

def create_app() -> FastAPI:
    app = FastAPI(title="LDA with Bearer Auth in Older FastAPI")

    @app.on_event("startup")
    async def on_startup():
        # Initialize MongoDB or any other DB
        await init_db(app)

    # Add your custom JWT middleware 
    # (which sets request.state.user_id if token is valid)
    app.add_middleware(JWTMiddleware)

    # Add CORS if needed
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include your routers
    app.include_router(auth_router, prefix="/auth", tags=["Auth"])
    app.include_router(documents_router, prefix="/documents", tags=["Documents"])
    app.include_router(compliance_router, prefix="/compliance", tags=["Compliance"])


    @app.get("/")
    async def root():
        return {"message": "Welcome to the LDA API"}

    return app

app = create_app()

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
