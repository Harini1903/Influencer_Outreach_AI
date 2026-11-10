
from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.influencer import Influencer
from app.models.embedding import Embedding
from app.services.embedding_service import generate_query_embedding


def hybrid_search_influencers(
    query: str,
    niche: str | None = None,
    platform: str | None = None,
    location: str | None = None,
    min_followers: int | None = None,
    max_followers: int | None = None,
    min_engagement: float | None = None,
    limit: int = 10
) -> list[dict]:
    """
    Retrieve influencers using semantic similarity
    combined with structured database filters.
    """

    if not query or not query.strip():
        raise ValueError("Search query cannot be empty")

    if not 1 <= limit <= 50:
        raise ValueError("Limit must be between 1 and 50")

    if min_followers is not None and min_followers < 0:
        raise ValueError("Minimum followers cannot be negative")

    if max_followers is not None and max_followers < 0:
        raise ValueError("Maximum followers cannot be negative")

    if (
        min_followers is not None
        and max_followers is not None
        and min_followers > max_followers
    ):
        raise ValueError("Minimum followers cannot exceed maximum followers")

    if min_engagement is not None and min_engagement < 0:
        raise ValueError("Minimum engagement cannot be negative")

    # Generate the brand requirement embedding
    query_vector = generate_query_embedding(query)

    # Start database session
    db = SessionLocal()

    try:
        distance = Embedding.embedding.cosine_distance(query_vector)

        stmt = (
            select(
                Influencer.id,
                Influencer.full_name,
                Influencer.username,
                Influencer.platform,
                Influencer.niche,
                Influencer.location,
                Influencer.follower_count,
                Influencer.average_views,
                Influencer.engagement_rate,
                Influencer.profile_url,
                (1 - distance).label("similarity")
            )
            .join(
                Embedding,
                Embedding.influencer_id == Influencer.id
            )
            .where(
                Embedding.content_id.is_(None),
                Embedding.embedding.is_not(None)
            )
        )

        # Structured metadata filters
        if niche:
            stmt = stmt.where(
                Influencer.niche.ilike(f"%{niche.strip()}%")
            )

        if platform:
            stmt = stmt.where(
                Influencer.platform.ilike(platform.strip())
            )

        if location:
            stmt = stmt.where(
                Influencer.location.ilike(f"%{location.strip()}%")
            )

        if min_followers is not None:
            stmt = stmt.where(
                Influencer.follower_count >= min_followers
            )

        if max_followers is not None:
            stmt = stmt.where(
                Influencer.follower_count <= max_followers
            )

        if min_engagement is not None:
            stmt = stmt.where(
                Influencer.engagement_rate >= min_engagement
            )

        # Rank matching influencers by cosine similarity
        stmt = (
            stmt
            .order_by(distance.asc())
            .limit(limit)
        )

        rows = db.execute(stmt).all()

        results = []

        for row in rows:
            results.append({
                "id": row.id,
                "name": row.full_name or row.username,
                "username": row.username,
                "platform": row.platform,
                "niche": row.niche,
                "location": row.location,
                "followers": row.follower_count,
                "average_views": (
                    float(row.average_views)
                    if row.average_views is not None
                    else None
                ),
                "engagement_rate": (
                    float(row.engagement_rate)
                    if row.engagement_rate is not None
                    else None
                ),
                "profile_url": row.profile_url,
                "similarity": round(
                    float(row.similarity), 4
                )
            })

        return results

    finally:
        db.close()
