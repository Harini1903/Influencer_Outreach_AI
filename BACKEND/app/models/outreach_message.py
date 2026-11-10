from sqlalchemy import Column, BigInteger, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.db.base import Base


class OutreachMessage(Base):
    __tablename__ = "outreach_messages"

    id = Column(BigInteger, primary_key=True)

    influencer_id = Column(
        BigInteger,
        ForeignKey("influencers.id", ondelete="CASCADE"),
        nullable=False
    )

    campaign_id = Column(
        BigInteger,
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False
    )

    subject = Column(Text, nullable=False)
    message = Column(Text, nullable=False)

    status = Column(String(50), nullable=False, default="draft")

    recipient_email = Column(String(255))

    sent_at = Column(DateTime(timezone=True))

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )