from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.influencer_dataset_service import (
    collect_and_save_influencers
)

router = APIRouter(
    prefix="/influencers",
    tags=["Influencer Discovery"]
)


class DiscoveryRequest(BaseModel):
    keyword: str = Field(..., min_length=2)
    niche: str = Field(..., min_length=2)
    max_results: int = Field(
        default=20,
        ge=1,
        le=50
    )


@router.post("/discover")
def discover_influencers(
    request: DiscoveryRequest
):
    """
    Perform a LIVE YouTube influencer discovery.

    Returns only the influencers discovered
    during this search.
    """

    try:
        result = collect_and_save_influencers(
            keyword=request.keyword,
            niche=request.niche,
            max_results=request.max_results
        )

        return {
            "message": "Live influencer discovery completed",
            "keyword": request.keyword,
            "niche": request.niche,
            "discovered": result["discovered"],
            "qualified": result["qualified"],
            "saved": result["saved"],
            "influencers": result["influencers"]
        }

    except Exception as e:
        print(
            "LIVE INFLUENCER DISCOVERY ERROR:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail=f"Influencer discovery failed: {str(e)}"
        )