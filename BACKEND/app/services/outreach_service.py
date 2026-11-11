import json
import os

from sqlalchemy.orm import Session

from app.ai.chat import chat
from app.models.campaign import Campaign
from app.models.influencer import Influencer
from app.models.outreach_message import OutreachMessage


async def generate_outreach_message(
    db: Session,
    campaign_id: int,
    influencer_id: int
) -> dict:
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id
    ).first()

    if not campaign:
        raise ValueError("Campaign not found.")

    influencer = db.query(Influencer).filter(
        Influencer.id == influencer_id
    ).first()

    if not influencer:
        raise ValueError("Influencer not found.")

    # ---------------------------------------------------------
    # Sender configuration
    # ---------------------------------------------------------
    # Set OUTREACH_SENDER_NAME in Render environment variables.
    # Example:
    # OUTREACH_SENDER_NAME=Harini P
    #
    # The fallback is used for local development.
    # ---------------------------------------------------------
    sender_name = os.getenv(
        "OUTREACH_SENDER_NAME",
        "Harini P"
    ).strip()

    if not sender_name:
        sender_name = "Harini P"

    brand_name = (
        campaign.brand_name or "Our Brand"
    ).strip()

    prompt = f"""
You are an expert influencer outreach specialist.

Generate a personalized professional outreach email for an influencer.

CAMPAIGN:
{json.dumps({
    "brand_name": campaign.brand_name,
    "industry": campaign.industry,
    "target_niche": campaign.target_niche,
    "target_location": campaign.target_location,
    "min_followers": campaign.min_followers,
    "max_followers": campaign.max_followers,
    "min_engagement_rate": campaign.min_engagement_rate,
    "campaign_description": campaign.campaign_description,
}, indent=2, default=str)}

INFLUENCER:
{json.dumps({
    "name": influencer.full_name or influencer.username,
    "username": influencer.username,
    "platform": influencer.platform,
    "niche": influencer.niche,
    "location": influencer.location,
    "followers": influencer.follower_count,
    "engagement_rate": influencer.engagement_rate,
    "email": influencer.email,
    "profile_url": influencer.profile_url,
}, indent=2, default=str)}

SENDER:
Name: {sender_name}
Brand: {brand_name}

INSTRUCTIONS:

1. Write a concise, personalized business outreach email.
2. Mention the brand and campaign naturally.
3. Explain why this influencer may be relevant.
4. Do not invent audience demographics, achievements,
   partnerships, statistics, or other information.
5. Only use information supplied above.
6. Do not mention the internal AI matching process.
7. Do not mention match scores.
8. Do not use generic phrases such as
   "I hope this email finds you well."
9. Keep the message professional but friendly.
10. Include a clear call to action.
11. Use the sender's actual name in the email signature.
12. NEVER use placeholders such as:
    "[Your Name]",
    "[Name]",
    "[Sender Name]",
    "[Your Company]",
    "[Company Name]",
    "Your Name",
    "Your Company".
13. The email signature MUST end with:

Best regards,
{sender_name}
{brand_name}

14. Return valid JSON only.

RESPONSE FORMAT:

{{
    "subject": "Potential Collaboration with {brand_name}",
    "message": "Hi ... Best regards, {sender_name} {brand_name}"
}}
"""

    response_chunks = []

    async for chunk in chat.stream(prompt):
        response_chunks.append(chunk)

    response_text = "".join(response_chunks).strip()

    if not response_text:
        raise RuntimeError(
            "LLM returned an empty outreach response."
        )

    # ---------------------------------------------------------
    # Parse JSON returned by the LLM
    # ---------------------------------------------------------
    try:
        result = json.loads(response_text)

    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "LLM returned an invalid JSON outreach response."
        ) from exc

    if not isinstance(result, dict):
        raise RuntimeError(
            "LLM returned an unexpected outreach response."
        )

    subject = result.get("subject")
    message = result.get("message")

    if not isinstance(subject, str) or not subject.strip():
        raise RuntimeError(
            "LLM did not return a valid email subject."
        )

    if not isinstance(message, str) or not message.strip():
        raise RuntimeError(
            "LLM did not return a valid email message."
        )

    message = message.strip()

    # ---------------------------------------------------------
    # Safety cleanup
    # ---------------------------------------------------------
    # Even if the LLM ignores the prompt and generates a
    # placeholder, replace it before saving the draft.
    # ---------------------------------------------------------

    placeholders = [
        "[Your Name]",
        "[Name]",
        "[Sender Name]",
        "[Your Company]",
        "[Company Name]",
        "Your Name",
        "Your Company",
    ]

    for placeholder in placeholders:
        message = message.replace(
            placeholder,
            sender_name if "Name" in placeholder else brand_name
        )

    # ---------------------------------------------------------
    # Make sure the email has the correct signature.
    # ---------------------------------------------------------

    signature = f"Best regards,\n{sender_name}\n{brand_name}"

    # Remove common incorrect signatures first.
    incorrect_signatures = [
        "Best regards,\n[Your Name]\n[Your Company]",
        "Best regards,\n[Your Name]\n[Company Name]",
        "Best regards,\nYour Name\nYour Company",
        "Best regards,\n[Name]\n[Company Name]",
        "Best regards,\n[Sender Name]\n[Company Name]",
    ]

    for incorrect_signature in incorrect_signatures:
        message = message.replace(
            incorrect_signature,
            signature
        )

    # ---------------------------------------------------------
    # If the model didn't include a signature at all,
    # append the correct one.
    # ---------------------------------------------------------

    if (
        "Best regards," not in message
        and "Kind regards," not in message
        and "Regards," not in message
    ):
        message = f"{message}\n\n{signature}"

    # ---------------------------------------------------------
    # Save outreach message
    # ---------------------------------------------------------

    outreach = OutreachMessage(
        campaign_id=campaign_id,
        influencer_id=influencer_id,
        subject=subject.strip(),
        message=message,
        status="draft",
        recipient_email=influencer.email,
    )

    db.add(outreach)
    db.commit()
    db.refresh(outreach)

    return {
        "id": outreach.id,
        "campaign_id": outreach.campaign_id,
        "influencer_id": outreach.influencer_id,
        "subject": outreach.subject,
        "message": outreach.message,
        "status": outreach.status,
        "recipient_email": outreach.recipient_email,
        "created_at": outreach.created_at,
    }