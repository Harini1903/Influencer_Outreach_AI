
from datetime import datetime, timezone, timedelta

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import func

from app.db.session import SessionLocal
from app.models.influencer import Influencer

from app.services.youtube_service import (
    search_channels,
    get_channel_details,
    get_recent_video_metrics
)


# Initial filtering criteria
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
    """Filter discovered influencers using campaign criteria."""

    qualified = []

    cutoff_date = datetime.now(timezone.utc) - timedelta(
        days=MAX_INACTIVE_DAYS
    )

    for record in records:

        subscribers = record.get("subscriber_count")
        interaction_rate = record.get("interaction_rate", 0)
        average_views = record.get("avg_views", 0)
        videos_analysed = record.get("videos_used", 0)

        latest_upload = parse_youtube_date(
            record.get("latest_upload")
        )

        # Subscriber count must be publicly available
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

        if latest_upload is None or latest_upload < cutoff_date:
            continue

        qualified.append(record)

    return qualified


def save_influencers(records, niche):
    """Insert new influencers or update existing YouTube records."""

    if not records:
        return 0

    db = SessionLocal()

    try:
        db_records = []

        for record in records:

            db_records.append({
                "username": record["channel_id"],
                "channel_id": record["channel_id"],
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

        # Avoid duplicate records using username + platform
        statement = insert(Influencer).values(db_records)

        statement = statement.on_conflict_do_update(
            index_elements=["username", "platform"],
            set_={
                "full_name": statement.excluded.full_name,
                "email": func.coalesce(statement.excluded.email, Influencer.email),
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

        return len(db_records)

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def collect_and_save_influencers(
    keyword: str,
    niche: str,
    max_results: int = 50
):
    """
    Complete pipeline:
    YouTube discovery -> channel details -> video metrics
    -> filtering -> Supabase storage.
    """

    print(f"Searching YouTube for: {keyword}")

    # 1. Discover channels
    channels = search_channels(keyword, max_results)

    print(f"Channels discovered: {len(channels)}")

    if not channels:
        return {
            "discovered": 0,
            "qualified": 0,
            "saved": 0
        }

    # 2. Retrieve channel details
    channel_ids = [
        channel["channel_id"] for channel in channels
    ]

    details = get_channel_details(channel_ids)

    # 3. Retrieve recent video metrics
    metrics = get_recent_video_metrics(details, max_videos=10)

    metrics_by_id = {
        item["channel_id"]: item for item in metrics
    }

    # 4. Combine channel details and metrics
    combined_records = []

    for channel in details:

        video_metrics = metrics_by_id.get(
            channel["channel_id"], {}
        )

        combined = {
            **channel,
            **video_metrics
        }

        combined_records.append(combined)

    # 5. Apply filtering criteria
    qualified_records = filter_influencers(
        combined_records
    )

    print(f"Qualified influencers: {len(qualified_records)}")

    # 6. Save qualified records in Supabase
    saved_count = save_influencers(
        qualified_records,
        niche
    )

    return {
        "discovered": len(combined_records),
        "qualified": len(qualified_records),
        "saved": saved_count
    }
