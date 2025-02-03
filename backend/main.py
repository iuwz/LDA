from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from app.mvc.views.auth import router as auth_router
from app.mvc.views.documents import router as documents_router
from app.mvc.views.analysis import router as analysis_router
from fastapi.middleware.cors import CORSMiddleware
#
# Initialize FastAPI app
app = FastAPI()

# MongoDB connection (MongoDB Atlas)
MONGO_URI = "mongodb+srv://aziz12121257:u87y24y6mQN6Wf7w@lda.f7pzx.mongodb.net/?retryWrites=true&w=majority&appName=LDA"
client = AsyncIOMotorClient(MONGO_URI)
db = client["LDA"]  # Replace with your database name

# Add MongoDB instance to app state for global access
@app.on_event("startup")
async def startup_db_client():
    app.state.db = db


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# Middleware for CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins, or specify domains: ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods: GET, POST, PUT, DELETE
    allow_headers=["*"],  # Allow all headers
)

# Include the routers for different modules
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(documents_router, prefix="/documents", tags=["Documents"])
app.include_router(analysis_router, prefix="/analysis", tags=["Analysis"])


# Root endpoint (basic health check)
@app.get("/")
async def root():
    return {"message": "Welcome to the Legal Document Analyzer API!"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
