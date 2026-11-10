
import json
from typing import Any
from app.core.config import settings
from app.services.hybrid_retrieval_service import hybrid_search_influencers
from app.ai.chat import chat


def build_campaign_query(campaign: dict) -> str:
    """
    Convert campaign requirements into a semantic search query.
    """

    query_parts = [
        campaign.get("campaign_description", ""),
        campaign.get("product", ""),
        campaign.get("niche", ""),
        campaign.get("target_audience", ""),
        campaign.get("content_style", ""),
        campaign.get("location", ""),
    ]

    query = " ".join(
        str(part).strip()
        for part in query_parts
        if part and str(part).strip()
    )

    if not query:
        raise ValueError(
            "Provide at least a campaign description, product, "
            "niche, or target audience."
        )

    return query


async def evaluate_influencer_matches(
    campaign: dict,
    candidates: list[dict]
) -> list[dict]:
    """
    Use the configured LLM provider to evaluate shortlisted influencers
    against campaign requirements.
    """

    if not candidates:
        return []

    prompt = f"""
You are an expert influencer marketing analyst.

Your task is to evaluate influencer profiles against a brand campaign.

CAMPAIGN REQUIREMENTS:
{json.dumps(campaign, indent=2, default=str)}

AVAILABLE INFLUENCER CANDIDATES:
{json.dumps(candidates, indent=2, default=str)}

INSTRUCTIONS:

1. Evaluate each candidate based on:
   - Niche relevance
   - Audience relevance
   - Content relevance
   - Follower count suitability
   - Engagement rate
   - Location suitability, if specified

2. Give each influencer a match_score between 0 and 100.

3. Give a short explanation for the score.

4. Identify strengths and potential concerns.

5. Return only candidate IDs that exist in the supplied candidate list.

6. Never invent follower counts, engagement rates, locations,
   audience demographics, or other influencer facts.

7. If information is missing, mention that it is unavailable.
   Do not assume that missing information is positive.

8. Do not treat vector similarity as the final campaign match score.
   It is only a retrieval signal.

9. Sort the matches from highest to lowest match_score.

10. Use these recommendation labels:
    - Strong Match: score >= 80
    - Good Match: score >= 60 and < 80
    - Moderate Match: score >= 40 and < 60
    - Low Match: score < 40

RESPONSE FORMAT:

Return valid JSON only, using this structure:

{{
    "matches": [
        {{
            "influencer_id": 123,
            "match_score": 85,
            "recommendation": "Strong Match",
            "reasons": [
                "Relevant niche",
                "Suitable engagement rate"
            ],
            "strengths": [
                "Creates relevant content"
            ],
            "concerns": [
                "Audience demographics are unavailable"
            ]
        }}
    ]
}}
"""

    response_chunks = []

    async for chunk in chat.stream(prompt):
        response_chunks.append(chunk)

    response_text = "".join(response_chunks).strip()

    if not response_text:
        raise RuntimeError("LLM returned an empty matching response.")

    try:
        result = json.loads(response_text)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "LLM returned an invalid JSON matching response."
        ) from exc

    if not isinstance(result, dict) or not isinstance(
        result.get("matches"), list
    ):
        raise RuntimeError("LLM returned an unexpected response format.")

    # Validate that Gemini only returns supplied influencer IDs.
    candidate_map = {
        str(candidate["id"]): candidate
        for candidate in candidates
    }

    validated_matches = []
    seen_ids = set()

    for match in result["matches"]:
        if not isinstance(match, dict):
            continue

        influencer_id = str(match.get("influencer_id", ""))

        if influencer_id not in candidate_map or influencer_id in seen_ids:
            continue

        try:
            score = float(match.get("match_score"))
        except (TypeError, ValueError):
            continue

        if not 0 <= score <= 100:
            continue

        seen_ids.add(influencer_id)

        if score >= 80:
            recommendation = "Strong Match"
        elif score >= 60:
            recommendation = "Good Match"
        elif score >= 40:
            recommendation = "Moderate Match"
        else:
            recommendation = "Low Match"

        candidate = candidate_map[influencer_id]

        validated_matches.append({
            "influencer_id": candidate["id"],
            "name": candidate.get("name"),
            "username": candidate.get("username"),
            "platform": candidate.get("platform"),
            "niche": candidate.get("niche"),
            "location": candidate.get("location"),
            "followers": candidate.get("followers"),
            "average_views": candidate.get("average_views"),
            "engagement_rate": candidate.get("engagement_rate"),
            "profile_url": candidate.get("profile_url"),
            "similarity": candidate.get("similarity"),
            "match_score": round(score, 2),
            "recommendation": recommendation,
            "reasons": match.get("reasons", []),
            "strengths": match.get("strengths", []),
            "concerns": match.get("concerns", [])
        })

    validated_matches.sort(
        key=lambda item: item["match_score"],
        reverse=True
    )

    return validated_matches


async def match_influencers_to_campaign(
    campaign: dict,
    limit: int = 10
) -> dict:
    """
    Retrieve relevant influencers and rank them using the configured LLM.
    """

    if not isinstance(campaign, dict):
        raise ValueError("Campaign must be provided as a dictionary.")

    if not 1 <= limit <= 50:
        raise ValueError("Limit must be between 1 and 50.")

    query = build_campaign_query(campaign)

    # Step 1: Retrieve candidates using hybrid retrieval.
    candidates = hybrid_search_influencers(
        query=query,
        niche=None,
        platform=campaign.get("platform"),
        location=None,
        min_followers=campaign.get("min_followers"),
        max_followers=campaign.get("max_followers"),
        min_engagement=campaign.get("min_engagement"),
        limit=limit
    )
    if not candidates:
        return {
            "message": "No influencers matched the retrieval filters.",
            "candidates_considered": 0,
            "matches": []
        }

    # Step 2: Evaluate candidates using Gemini.
    matches = await evaluate_influencer_matches(
        campaign=campaign,
        candidates=candidates
    )

    return {
        "message": "AI influencer matching completed.",
        "candidates_considered": len(candidates),
        "matches_returned": len(matches),
        "matches": matches
    }
