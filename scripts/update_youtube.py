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
    try:
        import yt_dlp  # noqa: F401
        return
    except ImportError:
        print("Installing yt-dlp...")

        subprocess.check_call([
            sys.executable,
            "-m",
            "pip",
            "install",
            "--disable-pip-version-check",
            "-U",
            "yt-dlp"
        ])


def fetch_playlist(playlist_id):
    """
    YouTube uploads playlist से पूरी list लेने की कोशिश करता है।
    """

    playlist_url = f"https://www.youtube.com/playlist?list={playlist_id}"

    command = [
        sys.executable,
        "-m",
        "yt_dlp",
        "--flat-playlist",
        "--dump-single-json",
        "--skip-download",
        "--no-warnings",
        "--ignore-errors",
        playlist_url
    ]

    print(f"Fetching playlist: {playlist_id}")

    result = subprocess.run(
        command,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print("Playlist fetch warning:")
        print(result.stderr[:1500])
        return []

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        print("Could not read playlist response.")
        print(result.stdout[:1500])
        return []

    return data.get("entries", []) or []


def fetch_shorts():
    """
    Channel के Shorts tab से Shorts IDs लेने की कोशिश करता है।
    """

    url = f"https://www.youtube.com/{CHANNEL_HANDLE}/shorts"

    command = [
        sys.executable,
        "-m",
        "yt_dlp",
        "--flat-playlist",
        "--dump-single-json",
        "--skip-download",
        "--no-warnings",
        "--ignore-errors",
        url
    ]

    print("Fetching YouTube Shorts...")

    result = subprocess.run(
        command,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print("Shorts fetch warning:")
        print(result.stderr[:1000])
        return []

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        print("Could not read Shorts response.")
        return []

    return data.get("entries", []) or []


def entry_to_video(entry, video_type):
    if not entry:
        return None

    video_id = entry.get("id")

    if not video_id:
        return None

    title = entry.get("title") or "Lokesh Information"

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
    Uploads playlist की सारी videos और Shorts को collect करता है।
    """

    uploads_playlist_id = "UU" + CHANNEL_ID[2:]

    playlist_entries = fetch_playlist(
        uploads_playlist_id
    )

    short_entries = fetch_shorts()

    short_ids = {
        entry.get("id")
        for entry in short_entries
        if entry and entry.get("id")
    }

    videos = []
    seen = set()

    # --------------------------------
    # ALL CHANNEL UPLOADS
    # --------------------------------

    for entry in playlist_entries:

        if not entry:
            continue

        video_id = entry.get("id")

        if not video_id:
            continue

        if video_id in seen:
            continue

        video_type = (
            "short"
            if video_id in short_ids
            else "video"
        )

        video = entry_to_video(
            entry,
            video_type
        )

        if video:
            videos.append(video)
            seen.add(video_id)

    # --------------------------------
    # SHORTS NOT FOUND IN UPLOADS
    # --------------------------------

    for entry in short_entries:

        if not entry:
            continue

        video_id = entry.get("id")

        if not video_id:
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
            "No YouTube videos were found. "
            "Existing videos.json was not replaced."
        )

    normal_count = sum(
        1 for video in videos
        if video.get("type") == "video"
    )

    short_count = sum(
        1 for video in videos
        if video.get("type") == "short"
    )

    print("-----------------------------------")
    print(f"Total uploads found: {len(videos)}")
    print(f"Normal videos: {normal_count}")
    print(f"Shorts: {short_count}")
    print("-----------------------------------")

    return videos


def save_videos(videos):
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

    temporary_file.replace(VIDEOS_FILE)

    print(
        f"Saved {len(videos)} videos to videos.json"
    )


def save_channel():
    uploads_playlist_id = ""

    if CHANNEL_ID.startswith("UC"):
        uploads_playlist_id = (
            "UU" + CHANNEL_ID[2:]
        )

    data = {
        "channelId": CHANNEL_ID,
        "uploadsPlaylistId": uploads_playlist_id,
        "channelUrl": (
            "https://www.youtube.com/channel/"
            + CHANNEL_ID
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
    valid_videos = []

    required_fields = [
        "id",
        "title",
        "url",
        "thumbnail",
        "published"
    ]

    for video in videos:

        if not isinstance(video, dict):
            continue

        if not all(
            video.get(field)
            for field in required_fields
        ):
            continue

        if video.get("type") not in [
            "video",
            "short"
        ]:
            video["type"] = "video"

        valid_videos.append(video)

    print(
        f"Validation: {len(valid_videos)} valid items"
    )

    return valid_videos


def main():

    print("===================================")
    print("Starting YouTube sync...")
    print("===================================")

    install_yt_dlp()

    videos = get_all_videos()

    videos = validate_videos(videos)

    if not videos:
        raise RuntimeError(
            "No valid videos found. "
            "Website data was not replaced."
        )

    save_videos(videos)

    save_channel()

    print("===================================")
    print("YouTube sync completed successfully.")
    print(f"Total items: {len(videos)}")
    print("===================================")


if __name__ == "__main__":
    main()
