from sqlalchemy import Column, BigInteger, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.db.base import Base


class InfluencerContent(Base):
    __tablename__ = "influencer_content"

    id = Column(BigInteger, primary_key=True)

    influencer_id = Column(
        BigInteger,
        ForeignKey("influencers.id", ondelete="CASCADE")
    )

    content_text = Column(Text, nullable=False)
    content_url = Column(Text)
    content_type = Column(String(50))
    published_at = Column(DateTime(timezone=True))

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )