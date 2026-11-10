from sqlalchemy import (
    Column,
    BigInteger,
    Numeric,
    String,
    DateTime,
    ForeignKey
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.db.base import Base


class CampaignMatch(Base):
    __tablename__ = "campaign_matches"

    id = Column(BigInteger, primary_key=True)

    campaign_id = Column(
        BigInteger,
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False
    )

    influencer_id = Column(
        BigInteger,
        ForeignKey("influencers.id", ondelete="CASCADE"),
        nullable=False
    )

    similarity = Column(Numeric(6, 4))

    match_score = Column(Numeric(5, 2))

    recommendation = Column(String(50))

    reasons = Column(JSONB)
    strengths = Column(JSONB)
    concerns = Column(JSONB)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )