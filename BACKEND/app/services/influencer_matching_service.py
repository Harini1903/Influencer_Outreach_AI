import json
from typing import Any

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
    Evaluate ALL retrieved influencers using the configured LLM.

    Important:
    The LLM must evaluate every supplied candidate.
    Campaign requirements such as followers, engagement and
    location are treated as ranking factors rather than
    automatic exclusion rules.
    """

    if not candidates:
        return []

    prompt = f"""
You are an expert influencer marketing analyst for an AI-powered
influencer discovery SaaS platform.

Your job is to RANK influencer candidates against a brand campaign.

==================================================
CAMPAIGN REQUIREMENTS
==================================================

{json.dumps(campaign, indent=2, default=str)}

==================================================
INFLUENCER CANDIDATES
==================================================

{json.dumps(candidates, indent=2, default=str)}

==================================================
IMPORTANT MATCHING RULES
==================================================

Evaluate EVERY influencer in the supplied candidate list.

Do NOT remove candidates simply because they are not a perfect match.

The goal is to rank the candidates from best to worst.

Use the following factors:

1. Niche relevance
2. Campaign/content relevance
3. Audience relevance
4. Follower count suitability
5. Engagement rate
6. Location suitability
7. Platform suitability
8. Overall campaign fit

Campaign requirements are ranking signals.

For example:

- If the campaign asks for Chennai creators, Chennai creators
  should score higher, but creators from another location should
  NOT automatically be removed.

- If the campaign asks for a minimum follower count, creators
  below that requirement can still be returned with a lower score.

- If engagement is below the requested threshold, reduce the score
  appropriately instead of automatically excluding the creator.

- If information is unavailable, do NOT invent it.

- Never invent follower counts, engagement rates, locations,
  audience demographics, niches, or other profile information.

==================================================
MATCH SCORE
==================================================

Give every candidate a match_score between 0 and 100.

Use this general interpretation:

90-100 = Excellent campaign fit
80-89  = Strong Match
70-79  = Good Match
60-69  = Potential Match
40-59  = Moderate Match
0-39   = Low Match

Do not give every influencer the same score.

Rank candidates according to their actual campaign relevance.

==================================================
CRITICAL REQUIREMENT
==================================================

You MUST return an entry for EVERY influencer supplied
in the candidate list.

Do not return only the best few.

If there are 13 candidates, return exactly 13 match entries.

If there are 10 candidates, return exactly 10 match entries.

The candidate IDs must come directly from the supplied candidates.

Never invent an influencer ID.

==================================================
RESPONSE FORMAT
==================================================

Return valid JSON only.

Use exactly this structure:

{{
    "matches": [
        {{
            "influencer_id": 123,
            "match_score": 85,
            "recommendation": "Strong Match",
            "reasons": [
                "Relevant niche",
                "Good campaign alignment"
            ],
            "strengths": [
                "Strong content relevance"
            ],
            "concerns": [
                "Location does not exactly match the campaign"
            ]
        }}
    ]
}}

Return ALL candidates.

Sort the matches from highest match_score to lowest match_score.
"""


    response_chunks = []

    async for chunk in chat.stream(prompt):
        response_chunks.append(chunk)

    response_text = "".join(response_chunks).strip()

    if not response_text:
        raise RuntimeError(
            "LLM returned an empty matching response."
        )

    # Remove accidental markdown JSON fences if the model adds them.
    if response_text.startswith("```"):
        response_text = response_text.replace(
            "```json",
            "",
            1
        ).replace(
            "```",
            "",
            1
        ).strip()

        if response_text.endswith("```"):
            response_text = response_text[:-3].strip()

    try:
        result = json.loads(response_text)

    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "LLM returned an invalid JSON matching response."
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
            "LLM returned an unexpected response format."
        )

    # ----------------------------------------------------------
    # Validate LLM results against the actual candidates
    # ----------------------------------------------------------

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

        # Ignore IDs that were not supplied to the LLM.
        if influencer_id not in candidate_map:
            continue

        # Prevent duplicate influencers.
        if influencer_id in seen_ids:
            continue

        try:
            score = float(
                match.get("match_score")
            )

        except (TypeError, ValueError):
            continue

        # Keep score within valid range.
        score = max(
            0,
            min(100, score)
        )

        candidate = candidate_map[influencer_id]

        # Determine recommendation ourselves so that
        # the backend remains consistent.
        if score >= 90:
            recommendation = "Excellent Match"

        elif score >= 80:
            recommendation = "Strong Match"

        elif score >= 70:
            recommendation = "Good Match"

        elif score >= 60:
            recommendation = "Potential Match"

        elif score >= 40:
            recommendation = "Moderate Match"

        else:
            recommendation = "Low Match"

        seen_ids.add(influencer_id)

        validated_matches.append({
            "influencer_id": candidate["id"],
            "name": candidate.get("name"),
            "username": candidate.get("username"),
            "platform": candidate.get("platform"),
            "niche": candidate.get("niche"),
            "location": candidate.get("location"),
            "followers": candidate.get("followers"),
            "average_views": candidate.get("average_views"),
            "engagement_rate": candidate.get(
                "engagement_rate"
            ),
            "profile_url": candidate.get(
                "profile_url"
            ),
            "similarity": candidate.get(
                "similarity"
            ),
            "match_score": round(score, 2),
            "recommendation": recommendation,
            "reasons": (
                match.get("reasons", [])
                if isinstance(
                    match.get("reasons", []),
                    list
                )
                else []
            ),
            "strengths": (
                match.get("strengths", [])
                if isinstance(
                    match.get("strengths", []),
                    list
                )
                else []
            ),
            "concerns": (
                match.get("concerns", [])
                if isinstance(
                    match.get("concerns", []),
                    list
                )
                else []
            )
        })

    # ----------------------------------------------------------
    # SAFETY NET
    # ----------------------------------------------------------
    # If the LLM accidentally omitted some candidates,
    # don't silently lose them.
    #
    # We add them back as lower-ranked candidates.
    # Their score is intentionally conservative because
    # the LLM did not provide an evaluation.
    # ----------------------------------------------------------

    for candidate in candidates:

        candidate_id = str(
            candidate["id"]
        )

        if candidate_id in seen_ids:
            continue

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
            "match_score": 0,
            "recommendation": "Low Match",
            "reasons": [
                "Candidate was retrieved but was not fully evaluated by the AI."
            ],
            "strengths": [],
            "concerns": [
                "AI evaluation was unavailable for this candidate."
            ]
        })

    # Highest score first.
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
    Retrieve a broad pool of influencers and rank them using AI.

    IMPORTANT:
    Retrieval filters are intentionally relaxed here.

    Followers, engagement and location are used by the AI as
    ranking factors instead of hard exclusion filters.
    """

    if not isinstance(campaign, dict):
        raise ValueError(
            "Campaign must be provided as a dictionary."
        )

    if not 1 <= limit <= 50:
        raise ValueError(
            "Limit must be between 1 and 50."
        )

    query = build_campaign_query(campaign)

    # ----------------------------------------------------------
    # STEP 1
    # Broad semantic / hybrid retrieval
    # ----------------------------------------------------------
    #
    # Do NOT pass campaign follower / engagement / location
    # requirements as hard retrieval filters.
    #
    # We want to give the AI a broad candidate pool and let
    # the scoring stage determine relevance.
    #
    # This is especially important because your database currently
    # contains only a small number of influencers.
    # ----------------------------------------------------------

    retrieval_limit = max(
        limit,
        30
    )

    retrieval_limit = min(
        retrieval_limit,
        50
    )

    candidates = hybrid_search_influencers(
        query=query,

        # Keep these broad.
        niche=None,
        platform=None,
        location=None,

        # IMPORTANT:
        # Do not hard-filter by followers or engagement here.
        min_followers=None,
        max_followers=None,
        min_engagement=None,

        limit=retrieval_limit
    )

    if not candidates:
        return {
            "message": (
                "No influencers were found in the "
                "retrieval database."
            ),
            "candidates_considered": 0,
            "matches_returned": 0,
            "matches": []
        }

    # ----------------------------------------------------------
    # STEP 2
    # AI evaluates the entire retrieved candidate pool.
    # ----------------------------------------------------------

    matches = await evaluate_influencer_matches(
        campaign=campaign,
        candidates=candidates
    )

    # ----------------------------------------------------------
    # STEP 3
    # Return the requested number of ranked results.
    # ----------------------------------------------------------

    final_matches = matches[:limit]

    return {
        "message": (
            "AI influencer matching completed."
        ),
        "candidates_considered": len(candidates),
        "matches_returned": len(final_matches),
        "matches": final_matches
    }