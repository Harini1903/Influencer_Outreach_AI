from datetime import datetime, timezone, timedelta

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import func, select

from app.db.session import SessionLocal
from app.models.influencer import Influencer

from app.services.youtube_service import (
    search_channels,
    get_channel_details,
    get_recent_video_metrics
)


# Discovery filtering criteria
MIN_SUBSCRIBERS = 5000
MAX_SUBSCRIBERS = 100000
MIN_INTERACTION_RATE = 1.0
MIN_AVERAGE_VIEWS = 500
MIN_VIDEOS_ANALYSED = 5
MAX_INACTIVE_DAYS = 90


def parse_youtube_date(date_string):
    """Convert YouTube's ISO date into a timezone-aware datetime."""

    if not date_string:
        return None

    return datetime.fromisoformat(
        date_string.replace("Z", "+00:00")
    )


def filter_influencers(records):
    """
    Filter only the influencers that actually satisfy
    the live discovery criteria.
    """

    qualified = []

    cutoff_date = (
        datetime.now(timezone.utc)
        - timedelta(days=MAX_INACTIVE_DAYS)
    )

    for record in records:

        subscribers = record.get("subscriber_count")
        interaction_rate = record.get("interaction_rate", 0)
        average_views = record.get("avg_views", 0)
        videos_analysed = record.get("videos_used", 0)

        latest_upload = parse_youtube_date(
            record.get("latest_upload")
        )

        # Subscriber count must be available
        if subscribers is None:
            continue

        if not MIN_SUBSCRIBERS <= subscribers <= MAX_SUBSCRIBERS:
            continue

        if interaction_rate < MIN_INTERACTION_RATE:
            continue

        if average_views < MIN_AVERAGE_VIEWS:
            continue

        if videos_analysed < MIN_VIDEOS_ANALYSED:
            continue

        if latest_upload is None:
            continue

        if latest_upload < cutoff_date:
            continue

        qualified.append(record)

    return qualified


def save_influencers(records, niche):
    """
    Insert/update YouTube influencers in the database.

    IMPORTANT:
    This function now returns the actual database records
    corresponding to the influencers discovered in THIS search.
    """

    if not records:
        return []

    db = SessionLocal()

    try:

        db_records = []

        channel_ids = []

        for record in records:

            channel_id = record["channel_id"]

            channel_ids.append(channel_id)

            db_records.append({
                "username": channel_id,
                "channel_id": channel_id,
                "platform": "youtube",
                "full_name": record.get("channel_name"),
                "email": record.get("business_email"),
                "bio": record.get("description"),
                "niche": niche,
                "location": record.get("country"),
                "follower_count": record["subscriber_count"],
                "engagement_rate": record["interaction_rate"],
                "profile_url": record["channel_url"],
                "average_views": record["avg_views"],
                "videos_analysed": record["videos_used"],
                "last_upload_at": parse_youtube_date(
                    record.get("latest_upload")
                )
            })

        # Insert or update existing YouTube influencer
        statement = insert(Influencer).values(db_records)

        statement = statement.on_conflict_do_update(
            index_elements=["username", "platform"],
            set_={
                "channel_id": statement.excluded.channel_id,
                "full_name": statement.excluded.full_name,
                "email": func.coalesce(
                    statement.excluded.email,
                    Influencer.email
                ),
                "bio": statement.excluded.bio,
                "niche": statement.excluded.niche,
                "location": statement.excluded.location,
                "follower_count": statement.excluded.follower_count,
                "engagement_rate": statement.excluded.engagement_rate,
                "profile_url": statement.excluded.profile_url,
                "average_views": statement.excluded.average_views,
                "videos_analysed": statement.excluded.videos_analysed,
                "last_upload_at": statement.excluded.last_upload_at,
                "updated_at": func.now()
            }
        )

        db.execute(statement)
        db.commit()

        # Fetch ONLY the influencers from this discovery request
        saved_influencers = db.execute(
            select(Influencer)
            .where(
                Influencer.channel_id.in_(channel_ids),
                Influencer.platform == "youtube"
            )
            .order_by(Influencer.id.desc())
        ).scalars().all()

        return saved_influencers

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def serialize_influencer(influencer):
    """
    Convert SQLAlchemy Influencer object into JSON-safe data
    for the frontend.
    """

    return {
        "id": influencer.id,
        "channel_id": influencer.channel_id,
        "username": influencer.username,
        "platform": influencer.platform,
        "full_name": influencer.full_name,
        "email": influencer.email,
        "bio": influencer.bio,
        "niche": influencer.niche,
        "location": influencer.location,
        "follower_count": influencer.follower_count,
        "engagement_rate": (
            float(influencer.engagement_rate)
            if influencer.engagement_rate is not None
            else None
        ),
        "average_views": (
            float(influencer.average_views)
            if influencer.average_views is not None
            else None
        ),
        "videos_analysed": influencer.videos_analysed,
        "last_upload_at": (
            influencer.last_upload_at.isoformat()
            if influencer.last_upload_at
            else None
        ),
        "profile_url": influencer.profile_url
    }


def collect_and_save_influencers(
    keyword: str,
    niche: str,
    max_results: int = 50
):
    """
    LIVE DISCOVERY PIPELINE

    YouTube search
        ↓
    Channel details
        ↓
    Recent video metrics
        ↓
    Filtering
        ↓
    Save/update database
        ↓
    Return ONLY influencers found in this search
    """

    print(f"Searching YouTube for: {keyword}")

    # --------------------------------------------------
    # 1. SEARCH YOUTUBE
    # --------------------------------------------------

    channels = search_channels(
        keyword,
        max_results
    )

    print(
        f"Channels discovered from YouTube: {len(channels)}"
    )

    if not channels:
        return {
            "discovered": 0,
            "qualified": 0,
            "saved": 0,
            "influencers": []
        }

    # --------------------------------------------------
    # 2. GET CHANNEL DETAILS
    # --------------------------------------------------

    channel_ids = [
        channel["channel_id"]
        for channel in channels
    ]

    details = get_channel_details(
        channel_ids
    )

    # --------------------------------------------------
    # 3. GET RECENT VIDEO METRICS
    # --------------------------------------------------

    metrics = get_recent_video_metrics(
        details,
        max_videos=10
    )

    metrics_by_id = {
        item["channel_id"]: item
        for item in metrics
    }

    # --------------------------------------------------
    # 4. COMBINE DATA
    # --------------------------------------------------

    combined_records = []

    for channel in details:

        video_metrics = metrics_by_id.get(
            channel["channel_id"],
            {}
        )

        combined = {
            **channel,
            **video_metrics
        }

        combined_records.append(combined)

    # --------------------------------------------------
    # 5. FILTER LIVE RESULTS
    # --------------------------------------------------

    qualified_records = filter_influencers(
        combined_records
    )

    print(
        f"Qualified live influencers: "
        f"{len(qualified_records)}"
    )

    # --------------------------------------------------
    # 6. SAVE + FETCH ONLY THIS SEARCH'S RESULTS
    # --------------------------------------------------

    saved_influencers = save_influencers(
        qualified_records,
        niche
    )

    # --------------------------------------------------
    # 7. RETURN ACTUAL LIVE RESULTS
    # --------------------------------------------------

    serialized = [
        serialize_influencer(influencer)
        for influencer in saved_influencers
    ]

    return {
        "discovered": len(combined_records),
        "qualified": len(qualified_records),
        "saved": len(saved_influencers),
        "influencers": serialized
    }