
import re
from typing import Optional


# Finds email addresses in publicly available text
EMAIL_PATTERN = re.compile(
    r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
)


def extract_business_email(
    channel_description: str
) -> Optional[str]:
    """
    Extract the first publicly listed email address
    from a YouTube channel description.
    """

    if not channel_description:
        return None

    matches = EMAIL_PATTERN.findall(channel_description)

    if not matches:
        return None

    return matches[0].lower()


from googleapiclient.discovery import build
from app.core.config import settings


def get_youtube_client():
    """Create a YouTube Data API client."""
    return build(
        "youtube",
        "v3",
        developerKey=settings.YOUTUBE_API_KEY
    )


def test_youtube_connection():
    """Test YouTube API using a simple channel search."""

    youtube = get_youtube_client()

    response = youtube.search().list(
        part="snippet",
        q="skincare routine",
        type="channel",
        maxResults=5
    ).execute()

    channels = response.get("items", [])

    print(f"Channels discovered: {len(channels)}")

    for channel in channels:
        print(
            "Channel:",
            channel["snippet"]["channelTitle"]
        )
        print(
            "Channel ID:",
            channel["snippet"]["channelId"]
        )


if __name__ == "__main__":
    test_youtube_connection()


def search_channels(query: str, max_results: int = 50):
    """
    Search YouTube for channels using a niche keyword.
    Returns unique channel IDs and basic search information.
    """

    youtube = get_youtube_client()

    channels = {}
    next_page_token = None

    while len(channels) < max_results:

        remaining = max_results - len(channels)

        request = youtube.search().list(
            part="snippet",
            q=query,
            type="channel",
            maxResults=min(remaining, 50),
            pageToken=next_page_token
        )

        response = request.execute()

        for item in response.get("items", []):
            snippet = item["snippet"]
            channel_id = snippet["channelId"]

            if channel_id not in channels:
                channels[channel_id] = {
                    "channel_id": channel_id,
                    "channel_name": snippet["channelTitle"],
                    "description": snippet.get("description", ""),
                    "found_via": query
                }

        next_page_token = response.get("nextPageToken")

        if not next_page_token:
            break

    return list(channels.values())


def get_channel_details(channel_ids: list[str]):
    """
    Fetch detailed information for YouTube channels.
    YouTube accepts a maximum of 50 channel IDs per request.
    """

    youtube = get_youtube_client()
    all_channels = []

    # Process channel IDs in batches of 50
    for i in range(0, len(channel_ids), 50):
        batch_ids = channel_ids[i:i + 50]

        response = youtube.channels().list(
            part="snippet,statistics,contentDetails",
            id=",".join(batch_ids)
        ).execute()

        for item in response.get("items", []):
            snippet = item.get("snippet", {})
            statistics = item.get("statistics", {})
            content = item.get("contentDetails", {})

            description = snippet.get("description", "")

            # Extract publicly listed email
            email = extract_business_email(description)

            # Extract website and social links from description
            urls = re.findall(
                r"https?://[^\s<>\"']+",
                description
            )

            channel_data = {
                "channel_id": item["id"],
                "channel_name": snippet.get("title"),
                "description": description,
                "country": snippet.get("country"),

                "subscriber_count": (
                    int(statistics["subscriberCount"])
                    if "subscriberCount" in statistics
                    else None
                ),

                "video_count": int(
                    statistics.get("videoCount", 0)
                ),

                "view_count": int(
                    statistics.get("viewCount", 0)
                ),

                "channel_url": (
                    f"https://www.youtube.com/channel/{item['id']}"
                ),

                "business_email": email,
                "public_links": urls,

                "uploads_playlist_id": (
                    content.get("relatedPlaylists", {}).get("uploads")
                )
            }

            all_channels.append(channel_data)

    return all_channels

    
def get_recent_video_metrics(channel_details: list, max_videos: int = 10):
    """
    Collect recent video statistics for each influencer
    using their YouTube uploads playlist.
    """

    youtube = get_youtube_client()
    results = []

    for channel in channel_details:

        playlist_id = channel.get("uploads_playlist_id")

        if not playlist_id:
            results.append({
                "channel_id": channel["channel_id"],
                "avg_views": 0,
                "interaction_rate": 0,
                "videos_used": 0,
                "latest_upload": None,
                "recent_titles": []
            })
            continue

        # Get recent videos from the uploads playlist
        playlist_response = youtube.playlistItems().list(
            part="contentDetails",
            playlistId=playlist_id,
            maxResults=min(max_videos, 50)
        ).execute()

        video_ids = [
            item["contentDetails"]["videoId"]
            for item in playlist_response.get("items", [])
        ]

        if not video_ids:
            results.append({
                "channel_id": channel["channel_id"],
                "avg_views": 0,
                "interaction_rate": 0,
                "videos_used": 0,
                "latest_upload": None,
                "recent_titles": []
            })
            continue

        # Retrieve video statistics in batches
        video_response = youtube.videos().list(
            part="snippet,statistics",
            id=",".join(video_ids)
        ).execute()

        total_views = 0
        total_interactions = 0
        views_list = []
        videos_used = 0
        titles = []
        latest_upload = None

        for video in video_response.get("items", []):

            snippet = video.get("snippet", {})
            stats = video.get("statistics", {})

            title = snippet.get("title", "")
            published_at = snippet.get("publishedAt")

            titles.append(title)

            if published_at:
                if latest_upload is None or published_at > latest_upload:
                    latest_upload = published_at

            # Skip videos without visible likes or valid views
            if "likeCount" not in stats:
                continue

            views = int(stats.get("viewCount", 0))
            likes = int(stats.get("likeCount", 0))
            comments = int(stats.get("commentCount", 0))

            if views <= 0:
                continue

            total_views += views
            total_interactions += likes + comments
            views_list.append(views)
            videos_used += 1

        avg_views = (
            sum(views_list) / videos_used
            if videos_used else 0
        )

        interaction_rate = (
            (total_interactions / total_views) * 100
            if total_views else 0
        )

        results.append({
            "channel_id": channel["channel_id"],
            "avg_views": round(avg_views, 2),
            "interaction_rate": round(interaction_rate, 2),
            "videos_used": videos_used,
            "latest_upload": latest_upload,
            "recent_titles": titles
        })

    return results

