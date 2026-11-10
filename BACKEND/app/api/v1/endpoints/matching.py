from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import traceback
from app.services.influencer_matching_service import (
    match_influencers_to_campaign
)


router = APIRouter()


class CampaignMatchRequest(BaseModel):
    campaign_description: str | None = None
    product: str | None = None
    niche: str | None = None
    target_audience: str | None = None
    content_style: str | None = None
    location: str | None = None

    platform: str | None = None

    min_followers: int | None = Field(default=None, ge=0)
    max_followers: int | None = Field(default=None, ge=0)
    min_engagement: float | None = Field(default=None, ge=0)

    limit: int = Field(default=30, ge=1, le=50)


@router.post("/match")
async def match_influencers(request: CampaignMatchRequest):
    campaign = request.model_dump(exclude={"limit"})

    try:
        result = await match_influencers_to_campaign(
            campaign=campaign,
            limit=request.limit
        )
        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc

    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        ) from exc