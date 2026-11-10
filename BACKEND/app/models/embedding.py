from sqlalchemy import Column, BigInteger, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

from app.db.base import Base


class Embedding(Base):
    __tablename__ = "embedding_store"

    id = Column(BigInteger, primary_key=True)

    influencer_id = Column(
        BigInteger,
        ForeignKey("influencers.id", ondelete="CASCADE")
    )

    content_id = Column(
        BigInteger,
        ForeignKey("influencer_content.id", ondelete="CASCADE")
    )

    content = Column(Text, nullable=False)
    embedding = Column(Vector(768))

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )