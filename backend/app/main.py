from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import engine
from .models import user, house, room, asset, rented_room, invoice
from .api.v1.api import api_router

# Import all models to ensure they are registered
user.User
house.House
room.Room
asset.Asset
rented_room.RentedRoom
invoice.Invoice

# Create database tables
user.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Room Management API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Room Management API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
