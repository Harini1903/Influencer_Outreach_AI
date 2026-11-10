from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.models.outreach_message import OutreachMessage
from app.db.session import get_db
from app.services.outreach_service import generate_outreach_message
from app.services.gmail_service import send_email

router = APIRouter(prefix="/outreach", tags=["Outreach"])


@router.post("/generate")
async def generate_outreach(
    campaign_id: int,
    influencer_id: int,
    db: Session = Depends(get_db)
):
    try:
        result = await generate_outreach_message(
            db=db,
            campaign_id=campaign_id,
            influencer_id=influencer_id
        )

        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc)
        )

    except Exception as exc:
        db.rollback()

        print("\n===== OUTREACH GENERATION ERROR =====")
        print(f"{type(exc).__name__}: {exc}")
        print("=====================================\n")

        raise HTTPException(
            status_code=500,
            detail="Outreach generation failed."
        ) from exc


@router.get("/campaign/{campaign_id}")
def get_campaign_outreach(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    messages = (
        db.query(OutreachMessage)
        .filter(OutreachMessage.campaign_id == campaign_id)
        .order_by(OutreachMessage.created_at.desc())
        .all()
    )

    return [
        {
            "id": message.id,
            "campaign_id": message.campaign_id,
            "influencer_id": message.influencer_id,
            "subject": message.subject,
            "message": message.message,
            "status": message.status,
            "recipient_email": message.recipient_email,
            "sent_at": message.sent_at,
            "created_at": message.created_at,
        }
        for message in messages
    ]


@router.patch("/{outreach_id}/status")
def update_outreach_status(
    outreach_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    allowed_statuses = {
        "draft",
        "approved",
        "rejected",
        "sent",
    }

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. Allowed values: "
                "draft, approved, rejected, sent."
            )
        )

    message = db.query(OutreachMessage).filter(
        OutreachMessage.id == outreach_id
    ).first()

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Outreach message not found."
        )

    message.status = status

    db.commit()
    db.refresh(message)

    return {
        "id": message.id,
        "campaign_id": message.campaign_id,
        "influencer_id": message.influencer_id,
        "subject": message.subject,
        "message": message.message,
        "status": message.status,
        "recipient_email": message.recipient_email,
        "sent_at": message.sent_at,
        "created_at": message.created_at,
    }
@router.post("/{outreach_id}/send")
def send_approved_outreach(
    outreach_id: int,
    db: Session = Depends(get_db)
):
    message = (
        db.query(OutreachMessage)
        .filter(OutreachMessage.id == outreach_id)
        .first()
    )

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Outreach message not found."
        )

    # Prevent duplicate sending
    if message.status == "sent":
        raise HTTPException(
            status_code=400,
            detail="This outreach message has already been sent."
        )

    if message.status != "approved":
        raise HTTPException(
            status_code=400,
            detail="Only approved outreach messages can be sent."
        )

    if not message.recipient_email:
        raise HTTPException(
            status_code=400,
            detail="Recipient email is not available."
        )

    try:
        result = send_email(
            recipient_email=message.recipient_email,
            subject=message.subject,
            message=message.message
        )

        message.status = "sent"
        message.sent_at = func.now()

        db.commit()
        db.refresh(message)

        return {
            "id": message.id,
            "campaign_id": message.campaign_id,
            "influencer_id": message.influencer_id,
            "recipient_email": message.recipient_email,
            "subject": message.subject,
            "status": message.status,
            "sent_at": message.sent_at,
            "gmail_message_id": result.get("message_id")
        }

    except Exception as exc:
        db.rollback()

        print("\n===== EMAIL SEND ERROR =====")
        print(f"{type(exc).__name__}: {exc}")
        print("============================\n")

        raise HTTPException(
            status_code=500,
            detail="Email sending failed."
        ) from exc