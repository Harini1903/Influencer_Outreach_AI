
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.influencer import Influencer
from app.models.embedding import Embedding
from app.services.embedding_service import generate_embedding


def prepare_influencer_text(influencer: Influencer) -> str:
    """
    Convert influencer profile information into searchable text.
    """

    parts = [
        f"Name: {influencer.full_name or influencer.username}",
        f"Platform: {influencer.platform}",
        f"Niche: {influencer.niche or 'Not specified'}",
        f"Bio: {influencer.bio or 'Not available'}",
        f"Location: {influencer.location or 'Not specified'}",
        f"Followers: {influencer.follower_count or 0}",
        f"Average views: {influencer.average_views or 0}",
        f"Engagement rate: {influencer.engagement_rate or 0}%",
    ]

    return "\n".join(parts)


def store_influencer_embeddings(db: Session) -> dict:
    """
    Generate and store influencer profile embeddings.
    Update existing profile embeddings and create missing ones.
    """

    influencers = (
        db.query(Influencer)
        .filter(Influencer.platform == "youtube")
        .all()
    )

    processed = 0
    skipped = 0

    try:
        for influencer in influencers:
            profile_text = prepare_influencer_text(influencer)
            vector = generate_embedding(profile_text)

            existing_embedding = db.query(Embedding).filter(
                Embedding.influencer_id == influencer.id,
                Embedding.content_id.is_(None)
            ).first()

            if existing_embedding:
                existing_embedding.content = profile_text
                existing_embedding.embedding = vector
                skipped += 1  # Existing record updated
            else:
                embedding_record = Embedding(
                    influencer_id=influencer.id,
                    content_id=None,
                    content=profile_text,
                    embedding=vector
                )
                db.add(embedding_record)
                processed += 1

            db.flush()

        db.commit()

        return {
            "total_influencers": len(influencers),
            "embeddings_created": processed,
            "already_existing": skipped
        }

    except Exception:
        db.rollback()
        raise


def generate_all_influencer_embeddings() -> dict:
    """
    Create a database session and generate embeddings.
    """

    db = SessionLocal()

    try:
        return store_influencer_embeddings(db)

    finally:
        db.close()
