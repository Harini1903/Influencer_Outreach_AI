
from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.influencer import Influencer
from app.models.embedding import Embedding
from app.services.embedding_service import generate_query_embedding


def search_similar_influencers(query: str, limit: int = 5):
    """
    Search influencer profiles using cosine similarity.
    """

    if not 1 <= limit <= 50:
        raise ValueError("Limit must be between 1 and 50")

    query_vector = generate_query_embedding(query)

    db = SessionLocal()

    try:
        distance = Embedding.embedding.cosine_distance(query_vector)

        stmt = (
            select(
                Influencer.id,
                Influencer.full_name,
                Influencer.niche,
                Influencer.follower_count,
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
            .order_by(distance)
            .limit(limit)
        )

        results = db.execute(stmt).all()

        return [
            {
                "id": row.id,
                "name": row.full_name,
                "niche": row.niche,
                "followers": row.follower_count,
                "engagement_rate": (
                    float(row.engagement_rate)
                    if row.engagement_rate is not None
                    else None
                ),
                "profile_url": row.profile_url,
                "similarity": round(float(row.similarity), 4)
            }
            for row in results
        ]

    finally:
        db.close()
