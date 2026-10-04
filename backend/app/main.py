from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import memories
from app.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mitra AI Memory API",
    description="API for Mitra, a private AI memory companion",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(memories.router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Mitra API is running"}
