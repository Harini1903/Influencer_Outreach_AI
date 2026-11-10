
from fastapi import APIRouter
from app.api.v1.endpoints.matching import router as matching_router
from app.api.v1.endpoints.campaigns import router as campaigns_router
from app.api.v1.endpoints import (
    influencers,
    influencer_discovery
)
from app.api.v1.endpoints.outreach import router as outreach_router

api_router = APIRouter()

api_router.include_router(influencers.router)
api_router.include_router(influencer_discovery.router)

api_router.include_router(
    matching_router,
    prefix="/matching",
    tags=["Influencer Matching"]
)
api_router.include_router(
    campaigns_router,
    prefix="/campaigns",
    tags=["Campaigns"]
)
api_router.include_router(outreach_router)