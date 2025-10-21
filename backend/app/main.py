from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import engine, Base
# Ensure models are imported so SQLAlchemy registers all tables before create_all
from .models import user, house, room, asset, rented_room, invoice  # noqa: F401
from .api.v2.api import api_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Room Management API", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v2")

@app.get("/")
def read_root():
    return {"message": "Room Management API is running"}
