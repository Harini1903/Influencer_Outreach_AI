
from app.services.influencer_matching_service import (
    match_influencers_to_campaign
)

campaign = {
    "campaign_description": (
        "We are launching a skincare product and looking for "
        "beauty creators who make skincare tutorials and "
        "honest product reviews."
    ),
    "product": "Skincare product",
    "niche": "Beauty",
    "target_audience": "People interested in skincare",
    "content_style": "Tutorials and honest product reviews",
    "location": "IN",
    "platform": "youtube",
    "min_followers": 5000,
    "max_followers": 100000,
    "min_engagement": 1.0
}

result = match_influencers_to_campaign(
    campaign=campaign,
    limit=5
)

print("\nAI MATCHING RESULTS")
print("===================")

print("Message:", result["message"])
print("Candidates:", result["candidates_considered"])

for influencer in result["matches"]:
    print("\nName:", influencer["name"])
    print("Match Score:", influencer["match_score"])
    print("Recommendation:", influencer["recommendation"])
    print("Reasons:", influencer["reasons"])
    print("Strengths:", influencer["strengths"])
    print("Concerns:", influencer["concerns"])
