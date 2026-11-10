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


def _clean_and_repair_json(text: str) -> dict | None:
    """
    Attempt multiple stages of JSON extraction and syntax repair:
    1. Extract markdown code fence
    2. Direct JSON parse
    3. Auto-fix missing commas between array string elements
    4. Auto-fix trailing commas before closing braces
    """
    if not text or not text.strip():
        return None

    cleaned = text.strip()

    # Extract markdown code fence if present
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.IGNORECASE)
    if fence_match:
        cleaned = fence_match.group(1).strip()
    else:
        brace_match = re.search(r"\{[\s\S]*\}", cleaned)
        if brace_match:
            cleaned = brace_match.group(0).strip()

    # Attempt 1: Direct JSON parse
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # Attempt 2: Regex repair for missing commas between string items in lists
    # (e.g. "reason 1"\n "reason 2" -> "reason 1",\n "reason 2")
    repaired = re.sub(r"(\"[^\"]*\")\s*\n\s*(\"[^\"]*\")", r"\1,\n\2", cleaned)
    # Remove trailing commas before closing brackets or braces
    repaired = re.sub(r",\s*([\]}])", r"\1", repaired)

    try:
        return json.loads(repaired)
    except Exception:
        pass

    return None


def _heuristic_fallback_evaluation(campaign: dict, candidates: list[dict]) -> list[dict]:
    """
    Guaranteed fallback scoring when the LLM service is unavailable
    or returns unrecoverable JSON. Calculates realistic match scores,
    recommendations, and reasons from database attributes.
    """
    validated_matches = []
    camp_niche = str(campaign.get("niche") or campaign.get("target_niche") or "").strip().lower()
    min_followers = campaign.get("min_followers") or 0
    max_followers = campaign.get("max_followers") or 1000000
    min_eng = float(campaign.get("min_engagement") or campaign.get("min_engagement_rate") or 0)

    for cand in candidates:
        score = 50.0
        reasons = []
        strengths = []
        concerns = []

        # 1. Semantic retrieval similarity signal
        similarity = float(cand.get("similarity") or 0.6)
        score += round(similarity * 25.0, 1)

        # 2. Niche alignment
        cand_niche = str(cand.get("niche") or "").strip()
        if camp_niche and camp_niche in cand_niche.lower():
            score += 15.0
            reasons.append(f"Content niche ({cand_niche}) directly aligns with campaign target.")
            strengths.append(f"Strong niche relevance in {cand_niche}.")
        else:
            concerns.append(f"Niche ({cand_niche or 'General'}) may differ slightly from campaign focus.")

        # 3. Follower range check
        followers = cand.get("followers") or 0
        if min_followers <= followers <= max_followers:
            score += 5.0
            reasons.append(f"Follower count ({followers:,}) within target campaign range.")
            strengths.append("Audience scale fits target tier.")
        else:
            concerns.append(f"Follower count ({followers:,}) outside preferred bracket.")

        # 4. Engagement rate check
        eng = float(cand.get("engagement_rate") or 0)
        if min_eng and eng >= min_eng:
            score += 10.0
            reasons.append(f"Engagement rate of {eng:.2f}% meets campaign minimum ({min_eng}%).")
            strengths.append(f"Good audience engagement ({eng:.2f}%).")
        elif eng > 2.5:
            score += 5.0
            reasons.append(f"Solid engagement rate of {eng:.2f}%.")

        final_score = round(min(98.0, max(25.0, score)), 2)

        if final_score >= 80:
            rec = "Strong Match"
        elif final_score >= 60:
            rec = "Good Match"
        elif final_score >= 40:
            rec = "Moderate Match"
        else:
            rec = "Low Match"

        validated_matches.append({
            "influencer_id": cand["id"],
            "name": cand.get("name"),
            "username": cand.get("username"),
            "platform": cand.get("platform"),
            "niche": cand.get("niche"),
            "location": cand.get("location"),
            "followers": cand.get("followers"),
            "average_views": cand.get("average_views"),
            "engagement_rate": cand.get("engagement_rate"),
            "profile_url": cand.get("profile_url"),
            "similarity": cand.get("similarity"),
            "match_score": final_score,
            "recommendation": rec,
            "reasons": reasons or ["Retrieved based on semantic profile relevance."],
            "strengths": strengths or ["Matches campaign search criteria."],
            "concerns": concerns
        })

    validated_matches.sort(key=lambda item: item["match_score"], reverse=True)
    return validated_matches


async def evaluate_influencer_matches(
    campaign: dict,
    candidates: list[dict]
) -> list[dict]:

    if not candidates:
        return []

    # Limit LLM evaluation to the top 15 retrieved candidates so Groq/Gemini
    # does not exceed token limits and truncate the JSON response mid-stream.
    evaluation_candidates = candidates[:15]

    prompt = f"""
You are an expert influencer marketing analyst.

Evaluate the following influencer candidates against the campaign requirements.

CAMPAIGN REQUIREMENTS:
{json.dumps(campaign, indent=2, default=str)}

AVAILABLE INFLUENCER CANDIDATES:
{json.dumps(evaluation_candidates, indent=2, default=str)}

IMPORTANT INSTRUCTIONS:
1. Evaluate every candidate provided in the list.
2. Return candidates with meaningful relevance, ranked highest to lowest match_score.
3. Give every candidate a match_score between 0 and 100.
4. Keep reasons, strengths, and concerns concise (1 short sentence each).
5. CRITICAL: Separate EVERY item in JSON lists with a comma. Return strictly valid JSON.

RECOMMENDATION LABELS:
80-100 = Strong Match
60-79 = Good Match
40-59 = Moderate Match
0-39 = Low Match

FORMAT:
{{
  "matches": [
    {{
      "influencer_id": 123,
      "match_score": 85,
      "recommendation": "Strong Match",
      "reasons": [
        "Relevant niche",
        "Strong audience engagement"
      ],
      "strengths": [
        "Good engagement rate"
      ],
      "concerns": []
    }}
  ]
}}
"""

    response_chunks = []
    try:
        async for chunk in chat.stream(prompt):
            response_chunks.append(chunk)
    except Exception as exc:
        print(f"[Matching Service] LLM streaming error: {exc}. Using heuristic evaluation fallback.")
        return _heuristic_fallback_evaluation(campaign, evaluation_candidates)

    response_text = "".join(response_chunks).strip()

    # Attempt multi-stage JSON parse & repair
    result = _clean_and_repair_json(response_text)

    # If the LLM returned unrecoverable JSON, fall back safely rather than crashing with 500
    if not result or not isinstance(result, dict) or not isinstance(result.get("matches"), list):
        print(f"[Matching Service] LLM output could not be parsed as JSON. Using heuristic evaluation fallback.")
        return _heuristic_fallback_evaluation(campaign, evaluation_candidates)

    candidate_map = {
        str(candidate["id"]): candidate
        for candidate in evaluation_candidates
    }

    validated_matches = []
    seen_ids = set()

    for match in result["matches"]:
        if not isinstance(match, dict):
            continue

        influencer_id = str(match.get("influencer_id", ""))

        if influencer_id not in candidate_map:
            continue

        if influencer_id in seen_ids:
            continue

        try:
            score = float(match.get("match_score", 0))
        except (TypeError, ValueError):
            score = 50.0

        score = min(100.0, max(0.0, score))
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

    # If all candidate IDs were missing from the LLM response, fall back safely
    if not validated_matches:
        return _heuristic_fallback_evaluation(campaign, evaluation_candidates)

    validated_matches.sort(
        key=lambda item: item["match_score"],
        reverse=True
    )

    return validated_matches


async def match_influencers_to_campaign(
    campaign: dict,
    limit: int = 10
) -> dict:

    if not isinstance(campaign, dict):
        raise ValueError("Campaign must be provided as a dictionary.")

    if not 1 <= limit <= 50:
        raise ValueError("Limit must be between 1 and 50.")

    query = build_campaign_query(campaign)

    # Objective numeric retrieval (niche and location are matched semantically)
    retrieval_limit = min(max(20, limit * 2), 30)

    candidates = hybrid_search_influencers(
        query=query,
        niche=None,
        location=None,
        platform=campaign.get("platform"),
        min_followers=campaign.get("min_followers"),
        max_followers=campaign.get("max_followers"),
        min_engagement=campaign.get("min_engagement"),
        limit=retrieval_limit
    )

    if not candidates:
        return {
            "message": "No influencers matched the retrieval filters.",
            "candidates_considered": 0,
            "matches_returned": 0,
            "matches": []
        }

    # Evaluate matches with automatic repair and fallback
    matches = await evaluate_influencer_matches(
        campaign=campaign,
        candidates=candidates
    )

    final_matches = matches[:limit]

    return {
        "message": "AI influencer matching completed.",
        "candidates_considered": len(candidates),
        "matches_returned": len(final_matches),
        "matches": final_matches
    }