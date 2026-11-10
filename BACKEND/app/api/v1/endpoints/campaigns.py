from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import traceback

from app.models.campaign_match import CampaignMatch
from app.db.session import get_db
from app.models.campaign import Campaign
from app.schemas.campaign import CampaignCreate, CampaignResponse

from app.services.influencer_matching_service import (
    match_influencers_to_campaign
)

router = APIRouter()

@router.get(
    "/",
    response_model=list[CampaignResponse]
)
def get_campaigns(
    db: Session = Depends(get_db)
):
    """
    Return campaigns stored in the database.

    These are user-created campaigns, not fake/generated data.
    """

    campaigns = (
        db.query(Campaign)
        .order_by(Campaign.id.desc())
        .all()
    )

    return campaigns
@router.post(
    "/",
    response_model=CampaignResponse,
    status_code=201
)
def create_campaign(
    request: CampaignCreate,
    db: Session = Depends(get_db)
):
    if (
        request.min_followers is not None
        and request.max_followers is not None
        and request.min_followers > request.max_followers
    ):
        raise HTTPException(
            status_code=400,
            detail="min_followers cannot be greater than max_followers."
        )

    campaign = Campaign(
        brand_name=request.brand_name,
        industry=request.industry,
        target_niche=request.target_niche,
        target_location=request.target_location,
        min_followers=request.min_followers,
        max_followers=request.max_followers,
        min_engagement_rate=request.min_engagement_rate,
        campaign_description=request.campaign_description
    )

    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    return campaign


@router.post("/{campaign_id}/match")
async def match_saved_campaign(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found."
        )

    matching_campaign = {
        "campaign_description": (
            campaign.campaign_description or ""
        ),
        "product": (
            campaign.industry or ""
        ),
        "niche": (
            campaign.target_niche or ""
        ),
        "location": (
            campaign.target_location or ""
        ),
        "min_followers": (
            campaign.min_followers
        ),
        "max_followers": (
            campaign.max_followers
        ),
        "min_engagement": (
            float(campaign.min_engagement_rate)
            if campaign.min_engagement_rate is not None
            else None
        ),
        "platform": None
    }

    print("\n==============================")
    print("CAMPAIGN MATCHING STARTED")
    print("==============================")
    print(
        "Campaign ID:",
        campaign.id
    )
    print(
        "Campaign:",
        matching_campaign
    )

    try:

        result = await match_influencers_to_campaign(
            campaign=matching_campaign,
            limit=10
        )

        print("\nMATCHING RESULT:")
        print(
            "Candidates:",
            result.get("candidates_considered")
        )
        print(
            "Matches:",
            result.get("matches_returned")
        )

        # Remove previous matches
        db.query(
            CampaignMatch
        ).filter(
            CampaignMatch.campaign_id == campaign.id
        ).delete(
            synchronize_session=False
        )

        # Save new matches
        for match in result.get(
            "matches",
            []
        ):

            campaign_match = CampaignMatch(
                campaign_id=campaign.id,
                influencer_id=match["influencer_id"],
                similarity=match.get(
                    "similarity"
                ),
                match_score=match.get(
                    "match_score"
                ),
                recommendation=match.get(
                    "recommendation"
                ),
                reasons=match.get(
                    "reasons",
                    []
                ),
                strengths=match.get(
                    "strengths",
                    []
                ),
                concerns=match.get(
                    "concerns",
                    []
                )
            )

            db.add(campaign_match)

        db.commit()

        print("==============================")
        print("CAMPAIGN MATCHING SUCCESS")
        print("==============================\n")

        return {
            "campaign_id": campaign.id,
            "brand_name": campaign.brand_name,
            **result
        }

    except ValueError as exc:

        db.rollback()

        print("\nVALUE ERROR:")
        traceback.print_exc()

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc

    except Exception as exc:

        db.rollback()

        print("\n==============================")
        print("CAMPAIGN MATCHING ERROR")
        print("==============================")

        traceback.print_exc()

        print("==============================\n")

        # TEMPORARY:
        # Return the actual error so we can identify
        # exactly where matching is failing.

        raise HTTPException(
            status_code=500,
            detail=f"Campaign matching failed: {str(exc)}"
        ) from exc