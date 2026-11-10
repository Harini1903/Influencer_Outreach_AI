from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
app = FastAPI(
    title="AI Influencer Discovery & Outreach",
    description="AI-powered influencer discovery and outreach automation",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Influencer Outreach API is running"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "backend"
    }


app.include_router(
    api_router,
    prefix="/api/v1"
)
