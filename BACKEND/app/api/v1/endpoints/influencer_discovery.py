
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.influencer_dataset_service import (
    collect_and_save_influencers
)

router = APIRouter()


class DiscoveryRequest(BaseModel):
    keyword: str = Field(..., min_length=2)
    niche: str = Field(..., min_length=2)
    max_results: int = Field(default=20, ge=1, le=50)


@router.post("/influencers/discover")
def discover_influencers(request: DiscoveryRequest):
    try:
        result = collect_and_save_influencers(
            keyword=request.keyword,
            niche=request.niche,
            max_results=request.max_results
        )

        return {
            "message": "Influencer discovery completed",
            "keyword": request.keyword,
            "niche": request.niche,
            "discovered": result["discovered"],
            "qualified": result["qualified"],
            "saved": result["saved"]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Influencer discovery failed: {str(e)}"
        )
