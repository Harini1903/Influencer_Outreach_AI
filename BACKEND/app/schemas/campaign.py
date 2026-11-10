from pydantic import BaseModel, Field


class CampaignCreate(BaseModel):
    brand_name: str = Field(..., min_length=1)
    industry: str | None = None
    target_niche: str | None = None
    target_location: str | None = None

    min_followers: int | None = Field(default=None, ge=0)
    max_followers: int | None = Field(default=None, ge=0)

    min_engagement_rate: float | None = Field(
        default=None,
        ge=0
    )

    campaign_description: str | None = None


class CampaignResponse(BaseModel):
    id: int
    brand_name: str
    industry: str | None
    target_niche: str | None
    target_location: str | None
    min_followers: int | None
    max_followers: int | None
    min_engagement_rate: float | None
    campaign_description: str | None

    model_config = {
        "from_attributes": True
    }