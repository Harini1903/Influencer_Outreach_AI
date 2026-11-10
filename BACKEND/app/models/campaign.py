from sqlalchemy import Column, BigInteger, String, Text, Numeric, DateTime
from sqlalchemy.sql import func

from app.db.base import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(BigInteger, primary_key=True)
    brand_name = Column(String(255), nullable=False)
    industry = Column(String(150))
    target_niche = Column(String(150))
    target_location = Column(String(150))
    min_followers = Column(BigInteger, default=0)
    max_followers = Column(BigInteger)
    min_engagement_rate = Column(Numeric(6, 2))
    campaign_description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())