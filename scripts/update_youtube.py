import json
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path


CHANNEL_ID = "UCVzNbULO0EWDiHTgUTprZ6Q"
CHANNEL_HANDLE = "@Lokeshinfo53"

ROOT = Path(__file__).resolve().parent.parent
VIDEOS_FILE = ROOT / "videos.json"
CHANNEL_FILE = ROOT / "channel.json"


def fetch(url):
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0"}
    )

    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def get_videos(channel_id):
    rss_url = (
        "https://www.youtube.com/feeds/videos.xml?channel_id="
        + channel_id
    )

    xml_data = fetch(rss_url)
    root = ET.fromstring(xml_data)

    namespace = {
        "atom": "http://www.w3.org/2005/Atom",
        "yt": "http://www.youtube.com/xml/schemas/2015"
    }

    videos = []

    for entry in root.findall("atom:entry", namespace):
        video_id = entry.findtext("yt:videoId", "", namespace)
        title = entry.findtext("atom:title", "", namespace)
        published = entry.findtext("atom:published", "", namespace)

        if video_id:
            videos.append({
                "id": video_id,
                "title": title,
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "thumbnail": (
                    "https://i.ytimg.com/vi/"
                    + video_id
                    + "/hqdefault.jpg"
                ),
                "published": published
            })

    return videos


def load_existing_videos():
    if not VIDEOS_FILE.exists():
        return []

    try:
        with open(VIDEOS_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)

        videos = data.get("videos", [])

        if isinstance(videos, list):
            return videos

    except Exception:
        pass

    return []


def merge_videos(new_videos, old_videos):
    merged = []
    seen = set()

    # नई videos पहले
    for video in new_videos:
        video_id = video.get("id")

        if video_id and video_id not in seen:
            merged.append(video)
            seen.add(video_id)

    # पुरानी videos भी सुरक्षित रहें
    for video in old_videos:
        video_id = video.get("id")

        if video_id and video_id not in seen:
            merged.append(video)
            seen.add(video_id)

    return merged


def save_videos(videos):
    data = {
        "videos": videos
    }

    with open(VIDEOS_FILE, "w", encoding="utf-8") as file:
        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2
        )

    print(f"Saved {len(videos)} videos to videos.json")


def save_channel(channel_id):
    # YouTube uploads playlist का standard ID
    uploads_playlist_id = ""

    if channel_id.startswith("UC"):
        uploads_playlist_id = "UU" + channel_id[2:]

    data = {
        "channelId": channel_id,
        "uploadsPlaylistId": uploads_playlist_id,
        "channelUrl": (
            "https://www.youtube.com/channel/"
            + channel_id
        ),
        "handle": CHANNEL_HANDLE
    }

    with open(CHANNEL_FILE, "w", encoding="utf-8") as file:
        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2
        )

    print("Saved channel.json")


def main():
    print("Starting YouTube sync...")

    channel_id = CHANNEL_ID

    print(f"Channel: {CHANNEL_HANDLE}")
    print(f"Channel ID: {channel_id}")

    new_videos = get_videos(channel_id)
    old_videos = load_existing_videos()

    videos = merge_videos(new_videos, old_videos)

    save_videos(videos)
    save_channel(channel_id)

    print("YouTube sync completed successfully.")


if __name__ == "__main__":
    main()
