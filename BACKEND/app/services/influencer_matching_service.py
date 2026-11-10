import json
import re

from app.services.hybrid_retrieval_service import (
    hybrid_search_influencers
)

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

    if not candidates:
        return []

    prompt = f"""
You are an expert influencer marketing analyst.

Evaluate ALL influencer candidates against the campaign.

CAMPAIGN REQUIREMENTS:
{json.dumps(campaign, indent=2, default=str)}

AVAILABLE INFLUENCER CANDIDATES:
{json.dumps(candidates, indent=2, default=str)}

IMPORTANT INSTRUCTIONS:

1. Evaluate EVERY candidate provided.

2. Do NOT return only the strongest few.

3. Return candidates that have meaningful relevance,
   even if they are not perfect matches.

4. Rank all candidates from highest to lowest score.

5. Give every candidate a match_score between 0 and 100.

6. Consider:
   - niche relevance
   - campaign relevance
   - audience relevance
   - content relevance
   - follower count
   - engagement rate
   - location
   - platform

7. Do NOT invent information.

8. If information is unavailable, say so.

9. Vector similarity is only a retrieval signal.
   It must NOT be used as the final match score.

10. A candidate does NOT need to satisfy every campaign
    requirement to be returned.

11. Prefer reasonable matches over returning an empty result.

RECOMMENDATION LABELS:
80-100 = Strong Match
60-79 = Good Match
40-59 = Moderate Match
0-39 = Low Match

RETURN VALID JSON ONLY.

FORMAT:
{{
    "matches": [
        {{
            "influencer_id": 123,
            "match_score": 85,
            "recommendation": "Strong Match",
            "reasons": [
                "Relevant content",
                "Good engagement"
            ],
            "strengths": [
                "Strong audience engagement"
            ],
            "concerns": [
                "Location information unavailable"
            ]
        }}
    ]
}}
"""

    response_chunks = []

    async for chunk in chat.stream(prompt):
        response_chunks.append(chunk)

    response_text = "".join(
        response_chunks
    ).strip()

    if not response_text:
        raise RuntimeError(
            "LLM returned an empty matching response."
        )

    # ------------------------------------------------------------------
    # Robust JSON extraction: handles preamble, markdown fences, and remarks
    # ------------------------------------------------------------------
    cleaned_text = response_text

    # 1. Match code fence ```json ... ``` anywhere in the response
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", response_text, re.IGNORECASE)
    if fence_match:
        cleaned_text = fence_match.group(1).strip()
    else:
        # 2. Match outermost JSON object { ... }
        brace_match = re.search(r"\{[\s\S]*\}", response_text)
        if brace_match:
            cleaned_text = brace_match.group(0).strip()

    try:
        result = json.loads(cleaned_text)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"LLM returned an invalid JSON matching response. Raw response: {response_text[:300]}"
        ) from exc

    if not isinstance(result, dict):
        raise RuntimeError(
            "LLM returned an unexpected response format."
        )

    if not isinstance(
        result.get("matches"),
        list
    ):
        raise RuntimeError(
            "LLM returned an unexpected matches format."
        )

    # Only allow IDs that were actually retrieved
    candidate_map = {
        str(candidate["id"]): candidate
        for candidate in candidates
    }

    validated_matches = []
    seen_ids = set()

    for match in result["matches"]:
        if not isinstance(match, dict):
            continue

        influencer_id = str(
            match.get("influencer_id", "")
        )

        if influencer_id not in candidate_map:
            continue

        if influencer_id in seen_ids:
            continue

        try:
            score = float(
                match.get("match_score")
            )
        except (
            TypeError,
            ValueError
        ):
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

        candidate = candidate_map[
            influencer_id
        ]

        validated_matches.append({
            "influencer_id": candidate["id"],
            "name": candidate.get("name"),
            "username": candidate.get("username"),
            "platform": candidate.get("platform"),
            "niche": candidate.get("niche"),
            "location": candidate.get("location"),
            "followers": candidate.get("followers"),
            "average_views": candidate.get(
                "average_views"
            ),
            "engagement_rate": candidate.get(
                "engagement_rate"
            ),
            "profile_url": candidate.get(
                "profile_url"
            ),
            "similarity": candidate.get(
                "similarity"
            ),
            "match_score": round(
                score,
                2
            ),
            "recommendation": recommendation,
            "reasons": match.get(
                "reasons",
                []
            ),
            "strengths": match.get(
                "strengths",
                []
            ),
            "concerns": match.get(
                "concerns",
                []
            )
        })

    validated_matches.sort(
        key=lambda item:
        item["match_score"],
        reverse=True
    )

    return validated_matches


async def match_influencers_to_campaign(
    campaign: dict,
    limit: int = 10
) -> dict:

    if not isinstance(
        campaign,
        dict
    ):
        raise ValueError(
            "Campaign must be provided as a dictionary."
        )

    if not 1 <= limit <= 50:
        raise ValueError(
            "Limit must be between 1 and 50."
        )

    query = build_campaign_query(
        campaign
    )

    # --------------------------------------------------
    # RETRIEVAL
    # --------------------------------------------------
    #
    # IMPORTANT:
    # We intentionally DO NOT hard-filter by:
    #
    #   niche
    #   location
    #
    # because these fields may be missing or formatted
    # differently in the influencer database.
    #
    # The semantic search + AI ranking will evaluate
    # these requirements instead.
    #
    # We only use objective numeric filters here.
    # --------------------------------------------------

    retrieval_limit = max(
        30,
        limit * 3
    )
    retrieval_limit = min(
        retrieval_limit,
        50
    )

    candidates = hybrid_search_influencers(
        query=query,
        # Do NOT hard-filter niche
        niche=None,
        # Do NOT hard-filter location
        location=None,
        platform=campaign.get(
            "platform"
        ),
        min_followers=campaign.get(
            "min_followers"
        ),
        max_followers=campaign.get(
            "max_followers"
        ),
        min_engagement=campaign.get(
            "min_engagement"
        ),
        limit=retrieval_limit
    )

    if not candidates:
        return {
            "message": (
                "No influencers matched "
                "the retrieval filters."
            ),
            "candidates_considered": 0,
            "matches_returned": 0,
            "matches": []
        }

    # --------------------------------------------------
    # AI EVALUATION
    # --------------------------------------------------
    matches = await evaluate_influencer_matches(
        campaign=campaign,
        candidates=candidates
    )

    # --------------------------------------------------
    # FINAL RESULTS
    # --------------------------------------------------
    final_matches = matches[:limit]

    return {
        "message": (
            "AI influencer matching completed."
        ),
        "candidates_considered": len(
            candidates
        ),
        "matches_returned": len(
            final_matches
        ),
        "matches": final_matches
    }