from sqlalchemy import (
    Column, BigInteger, String, Text,
    Numeric, DateTime, UniqueConstraint, Integer
)
from sqlalchemy.sql import func

from app.db.base import Base


class Influencer(Base):
    __tablename__ = "influencers"

    id = Column(BigInteger, primary_key=True, index=True)
    channel_id = Column(String(255), unique=True, index=True)
    average_views = Column(Numeric(14, 2))
    videos_analysed = Column(Integer, default=0)
    last_upload_at = Column(DateTime(timezone=True))
    username = Column(String(255), nullable=False)
    platform = Column(String(50), nullable=False)
    full_name = Column(String(255))
    email = Column(String(255))
    bio = Column(Text)
    niche = Column(String(150))
    location = Column(String(150))
    follower_count = Column(BigInteger, default=0)
    engagement_rate = Column(Numeric(6, 2))
    profile_url = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("username", "platform"),
    )