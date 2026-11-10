from pydantic import BaseModel, ConfigDict, Field, HttpUrl
from typing import Optional
from decimal import Decimal


class InfluencerCreate(BaseModel):

    username: str = Field(min_length=1, max_length=255)
    platform: str = Field(min_length=1, max_length=50)

    full_name: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    niche: Optional[str] = None
    location: Optional[str] = None

    follower_count: int = Field(default=0, ge=0)
    engagement_rate: Optional[Decimal] = Field(
        default=None, ge=0, le=100
    )

    profile_url: Optional[HttpUrl] = None


class InfluencerUpdate(BaseModel):

    full_name: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    niche: Optional[str] = None
    location: Optional[str] = None
    follower_count: Optional[int] = Field(default=None, ge=0)
    engagement_rate: Optional[Decimal] = Field(
        default=None, ge=0, le=100
    )
    profile_url: Optional[HttpUrl] = None


class InfluencerResponse(BaseModel):

    id: int
    username: str
    platform: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    niche: Optional[str] = None
    location: Optional[str] = None
    follower_count: int
    engagement_rate: Optional[Decimal] = None
    profile_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)