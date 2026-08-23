import json
import subprocess
import sys
from pathlib import Path


CHANNEL_ID = "UCVzNbULO0EWDiHTgUTprZ6Q"
CHANNEL_HANDLE = "@Lokeshinfo53"

ROOT = Path(__file__).resolve().parent.parent
VIDEOS_FILE = ROOT / "videos.json"
CHANNEL_FILE = ROOT / "channel.json"


def install_yt_dlp():
    """
    GitHub Actions में yt-dlp उपलब्ध न हो तो install करें।
    """
    try:
        import yt_dlp  # noqa: F401
        return
    except ImportError:
        print("yt-dlp not found. Installing...")

        subprocess.check_call([
            sys.executable,
            "-m",
            "pip",
            "install",
            "--disable-pip-version-check",
            "-U",
            "yt-dlp"
        ])


def get_all_videos():
    """
    YouTube channel की पूरी Videos list निकालता है।
    YouTube Data API / Google Cloud की जरूरत नहीं।
    """

    channel_url = f"https://www.youtube.com/{CHANNEL_HANDLE}/videos"

    command = [
        sys.executable,
        "-m",
        "yt_dlp",
        "--flat-playlist",
        "--dump-single-json",
        "--skip-download",
        "--no-warnings",
        "--ignore-errors",
        channel_url
    ]

    print("Fetching all videos from YouTube...")
    print(f"Channel: {CHANNEL_HANDLE}")

    result = subprocess.run(
        command,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print("yt-dlp error:")
        print(result.stderr)
        raise RuntimeError("YouTube videos fetch failed.")

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        print("Could not read YouTube response.")
        print(result.stdout[:2000])
        raise

    entries = data.get("entries", [])

    videos = []
    seen = set()

    for entry in entries:
        if not entry:
            continue

        video_id = entry.get("id")

        if not video_id or video_id in seen:
            continue

        title = entry.get("title") or "YouTube Video"

        upload_date = entry.get("upload_date") or ""

        if upload_date and len(upload_date) == 8:
            published = (
                upload_date[0:4]
                + "-"
                + upload_date[4:6]
                + "-"
                + upload_date[6:8]
            )
        else:
            published = ""

        videos.append({
            "id": video_id,
            "title": title,
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "thumbnail": (
                f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
            ),
            "published": published
        })

        seen.add(video_id)

    if not videos:
        raise RuntimeError(
            "No videos were found. Existing videos.json was not replaced."
        )

    print(f"Found {len(videos)} videos.")

    return videos


def load_existing_videos():
    """
    पुराने videos.json को backup/reference के रूप में पढ़ता है।
    """

    if not VIDEOS_FILE.exists():
        return []

    try:
        with open(VIDEOS_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)

        videos = data.get("videos", [])

        if isinstance(videos, list):
            return videos

    except Exception as error:
        print(f"Could not read existing videos.json: {error}")

    return []


def merge_videos(new_videos, old_videos):
    """
    नई और पुरानी videos को ID के आधार पर merge करता है।
    Duplicate videos नहीं आएंगी।
    """

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
    """
    Website के existing videos.json format को बिल्कुल वही रखता है।
    """

    data = {
        "videos": videos
    }

    temporary_file = VIDEOS_FILE.with_suffix(".json.tmp")

    with open(temporary_file, "w", encoding="utf-8") as file:
        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2
        )

    # सफल JSON बनने के बाद ही असली file replace होगी
    temporary_file.replace(VIDEOS_FILE)

    print(f"Saved {len(videos)} videos to videos.json")


def save_channel(channel_id):
    """
    Existing channel.json structure को बनाए रखता है।
    """

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


def validate_videos(videos):
    """
    Website में खराब data जाने से पहले basic checking।
    """

    required_fields = [
        "id",
        "title",
        "url",
        "thumbnail",
        "published"
    ]

    valid_videos = []

    for video in videos:
        if not isinstance(video, dict):
            continue

        if all(video.get(field) for field in required_fields):
            valid_videos.append(video)

    print(
        f"Validation: {len(valid_videos)} valid videos "
        f"out of {len(videos)}"
    )

    return valid_videos


def main():
    print("===================================")
    print("Starting YouTube sync...")
    print("===================================")

    install_yt_dlp()

    old_videos = load_existing_videos()

    print(f"Existing videos: {len(old_videos)}")

    new_videos = get_all_videos()

    videos = merge_videos(
        new_videos,
        old_videos
    )

    videos = validate_videos(videos)

    if not videos:
        raise RuntimeError(
            "No valid videos available. "
            "Existing website data was not replaced."
        )

    save_videos(videos)
    save_channel(CHANNEL_ID)

    print("===================================")
    print("YouTube sync completed successfully.")
    print(f"Total videos: {len(videos)}")
    print("===================================")


if __name__ == "__main__":
    main()
