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


def fetch_channel_tab(tab):
    """
    YouTube channel की अलग-अलग tabs से videos निकालता है।

    videos = normal videos
    shorts = Shorts
    streams = live streams
    """

    channel_url = f"https://www.youtube.com/{CHANNEL_HANDLE}/{tab}"

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

    print(f"Fetching YouTube {tab}...")
    print(f"URL: {channel_url}")

    result = subprocess.run(
        command,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(f"Warning: Could not fetch {tab}")
        print(result.stderr[:1000])
        return []

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        print(f"Warning: Could not read {tab} response.")
        print(result.stdout[:1000])
        return []

    entries = data.get("entries", []) or []

    print(f"{tab}: {len(entries)} entries found.")

    return entries


def entry_to_video(entry, video_type):
    """
    yt-dlp entry को website के JSON format में बदलता है।
    """

    if not entry:
        return None

    video_id = entry.get("id")

    if not video_id:
        return None

    title = entry.get("title") or "YouTube Video"

    upload_date = entry.get("upload_date") or ""

    published = ""

    if upload_date and len(upload_date) == 8:
        published = (
            upload_date[0:4]
            + "-"
            + upload_date[4:6]
            + "-"
            + upload_date[6:8]
        )

    return {
        "id": video_id,
        "title": title,
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "thumbnail": (
            f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
        ),
        "published": published,
        "type": video_type
    }


def get_all_videos():
    """
    Normal Videos और Shorts को अलग-अलग पहचानता है।

    Live streams को website feed से बाहर रखा जाता है.
    """

    normal_entries = fetch_channel_tab("videos")
    short_entries = fetch_channel_tab("shorts")
    live_entries = fetch_channel_tab("streams")

    short_ids = {
        entry.get("id")
        for entry in short_entries
        if entry and entry.get("id")
    }

    live_ids = {
        entry.get("id")
        for entry in live_entries
        if entry and entry.get("id")
    }

    videos = []
    seen = set()

    # --------------------------------
    # NORMAL VIDEOS
    # --------------------------------

    for entry in normal_entries:

        if not entry:
            continue

        video_id = entry.get("id")

        if not video_id:
            continue

        # Shorts और Live को normal videos में मत डालो
        if video_id in short_ids:
            continue

        if video_id in live_ids:
            continue

        if video_id in seen:
            continue

        video = entry_to_video(
            entry,
            "video"
        )

        if video:
            videos.append(video)
            seen.add(video_id)

    # --------------------------------
    # SHORTS
    # --------------------------------

    for entry in short_entries:

        if not entry:
            continue

        video_id = entry.get("id")

        if not video_id:
            continue

        # Live को Shorts में भी मत डालो
        if video_id in live_ids:
            continue

        if video_id in seen:
            continue

        video = entry_to_video(
            entry,
            "short"
        )

        if video:
            videos.append(video)
            seen.add(video_id)

    if not videos:
        raise RuntimeError(
            "No videos or shorts were found. "
            "Existing videos.json was not replaced."
        )

    print("-----------------------------------")
    print(f"Total uploads found: {len(videos)}")
    print(
        f"Normal videos: "
        f"{sum(1 for v in videos if v['type'] == 'video')}"
    )
    print(
        f"Shorts: "
        f"{sum(1 for v in videos if v['type'] == 'short')}"
    )
    print(
        f"Live items excluded: "
        f"{len(live_ids)}"
    )
    print("-----------------------------------")

    return videos


def load_existing_videos():
    """
    पुराने videos.json को पढ़ता है।
    """

    if not VIDEOS_FILE.exists():
        return []

    try:
        with open(
            VIDEOS_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(file)

        videos = data.get("videos", [])

        if isinstance(videos, list):
            return videos

    except Exception as error:
        print(
            f"Could not read existing videos.json: "
            f"{error}"
        )

    return []


def merge_videos(new_videos, old_videos):
    """
    नई और पुरानी videos को ID के आधार पर merge करता है।

    नई जानकारी को priority मिलती है।
    Duplicate videos नहीं आएंगी।
    """

    merged = []
    seen = set()

    # --------------------------------
    # नई videos पहले
    # --------------------------------

    for video in new_videos:

        if not isinstance(video, dict):
            continue

        video_id = video.get("id")

        if video_id and video_id not in seen:

            merged.append(video)
            seen.add(video_id)

    # --------------------------------
    # पुरानी videos
    # --------------------------------

    for video in old_videos:

        if not isinstance(video, dict):
            continue

        video_id = video.get("id")

        if not video_id:
            continue

        if video_id in seen:
            continue

        # पुराने data में type नहीं है
        # तो normal video मानेंगे
        if video.get("type") not in [
            "video",
            "short"
        ]:
            video["type"] = "video"

        # पुराने data में published नहीं है
        if "published" not in video:
            video["published"] = ""

        merged.append(video)
        seen.add(video_id)

    return merged


def save_videos(videos):
    """
    videos.json को सुरक्षित तरीके से save करता है।
    """

    data = {
        "videos": videos
    }

    temporary_file = VIDEOS_FILE.with_suffix(
        ".json.tmp"
    )

    with open(
        temporary_file,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2
        )

    # JSON सफल होने के बाद ही
    # असली file replace होगी
    temporary_file.replace(VIDEOS_FILE)

    print(
        f"Saved {len(videos)} videos to videos.json"
    )


def save_channel(channel_id):
    """
    channel.json save करता है।
    """

    uploads_playlist_id = ""

    if channel_id.startswith("UC"):
        uploads_playlist_id = (
            "UU" + channel_id[2:]
        )

    data = {
        "channelId": channel_id,
        "uploadsPlaylistId": uploads_playlist_id,
        "channelUrl": (
            "https://www.youtube.com/channel/"
            + channel_id
        ),
        "handle": CHANNEL_HANDLE
    }

    with open(
        CHANNEL_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2
        )

    print("Saved channel.json")


def validate_videos(videos):
    """
    Website में खराब data जाने से रोकता है।

    IMPORTANT:
    published अब required field नहीं है,
    क्योंकि YouTube flat-playlist में
    upload date खाली आ सकती है।
    """

    required_fields = [
        "id",
        "title",
        "url",
        "thumbnail"
    ]

    valid_videos = []

    for video in videos:

        if not isinstance(video, dict):
            continue

        # ID, title, URL और thumbnail जरूरी हैं
        if not all(
            video.get(field)
            for field in required_fields
        ):
            continue

        # published खाली हो सकता है
        if not video.get("published"):
            video["published"] = ""

        # केवल video या short
        if video.get("type") not in [
            "video",
            "short"
        ]:
            video["type"] = "video"

        valid_videos.append(video)

    print(
        f"Validation: "
        f"{len(valid_videos)} valid items "
        f"out of {len(videos)}"
    )

    return valid_videos


def main():

    print("===================================")
    print("Starting YouTube sync...")
    print("===================================")

    # yt-dlp install/check
    install_yt_dlp()

    # पुराने data को पढ़ो
    old_videos = load_existing_videos()

    print(
        f"Existing videos: "
        f"{len(old_videos)}"
    )

    # YouTube से videos + shorts लाओ
    new_videos = get_all_videos()

    # नई और पुरानी videos merge
    videos = merge_videos(
        new_videos,
        old_videos
    )

    print(
        f"After merge: "
        f"{len(videos)} videos"
    )

    # Data validation
    videos = validate_videos(
        videos
    )

    # अगर कुछ भी valid नहीं है
    # तो पुरानी videos.json को replace मत करो
    if not videos:
        raise RuntimeError(
            "No valid videos found. "
            "Website data was not replaced."
        )

    # Website files save करो
    save_videos(videos)
    save_channel(CHANNEL_ID)

    print("===================================")
    print(
        "YouTube sync completed successfully."
    )
    print(
        f"Total videos: {len(videos)}"
    )
    print("===================================")


if __name__ == "__main__":
    main()
