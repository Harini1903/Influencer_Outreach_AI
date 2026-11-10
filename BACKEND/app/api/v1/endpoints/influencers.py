from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from datetime import datetime, timezone

from app.db.session import get_db
from app.models.influencer import Influencer

from app.schemas.influencer import (
    InfluencerCreate,
    InfluencerUpdate,
    InfluencerResponse
)


router = APIRouter(
    prefix="/influencers",
    tags=["Influencers"]
)


# ============================================================
# CREATE INFLUENCER
# ============================================================

@router.post(
    "/",
    response_model=InfluencerResponse,
    status_code=status.HTTP_201_CREATED
)
def create_influencer(
    influencer_data: InfluencerCreate,
    db: Session = Depends(get_db)
):

    existing = db.execute(
        select(Influencer).where(
            Influencer.username == influencer_data.username,
            Influencer.platform == influencer_data.platform
        )
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Influencer already exists on this platform"
        )

    data = influencer_data.model_dump()

    if data.get("profile_url"):
        data["profile_url"] = str(data["profile_url"])

    influencer = Influencer(**data)

    try:
        db.add(influencer)
        db.commit()
        db.refresh(influencer)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Influencer already exists"
        )

    return influencer


# ============================================================
# GET ALL INFLUENCERS
# ============================================================

@router.get(
    "/",
    response_model=list[InfluencerResponse]
)
def get_influencers(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):

    influencers = db.execute(
        select(Influencer)
        .offset(skip)
        .limit(min(limit, 100))
        .order_by(Influencer.id.desc())
    ).scalars().all()

    return influencers


# ============================================================
# GET INFLUENCER BY ID
# ============================================================

@router.get(
    "/{influencer_id}",
    response_model=InfluencerResponse
)
def get_influencer(
    influencer_id: int,
    db: Session = Depends(get_db)
):

    influencer = db.get(
        Influencer,
        influencer_id
    )

    if not influencer:
        raise HTTPException(
            status_code=404,
            detail="Influencer not found"
        )

    return influencer


# ============================================================
# UPDATE INFLUENCER
# ============================================================

@router.put(
    "/{influencer_id}",
    response_model=InfluencerResponse
)
def update_influencer(
    influencer_id: int,
    influencer_data: InfluencerUpdate,
    db: Session = Depends(get_db)
):

    influencer = db.get(
        Influencer,
        influencer_id
    )

    if not influencer:
        raise HTTPException(
            status_code=404,
            detail="Influencer not found"
        )

    update_data = influencer_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():

        if key == "profile_url" and value is not None:
            value = str(value)

        setattr(
            influencer,
            key,
            value
        )

    influencer.updated_at = datetime.now(
        timezone.utc
    )

    try:
        db.commit()
        db.refresh(influencer)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Unable to update influencer "
                "due to a database conflict"
            )
        )

    return influencer


# ============================================================
# DELETE INFLUENCER
# ============================================================

@router.delete(
    "/{influencer_id}"
)
def delete_influencer(
    influencer_id: int,
    db: Session = Depends(get_db)
):

    influencer = db.get(
        Influencer,
        influencer_id
    )

    if not influencer:
        raise HTTPException(
            status_code=404,
            detail="Influencer not found"
        )

    db.delete(influencer)
    db.commit()

    return {
        "message": "Influencer deleted successfully",
        "influencer_id": influencer_id
    }