# backend/app/core/database.py
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import FastAPI

load_dotenv()  # Read from .env

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "legaldb")

async def init_db(app: FastAPI):
    """
    Creates a single MongoDB client for the entire app lifetime
    and attaches it to app.state.db
    """
    client = AsyncIOMotorClient(MONGODB_URI)
    app.state.db = client[DB_NAME]
    print(f"Connected to MongoDB database: {DB_NAME}")
