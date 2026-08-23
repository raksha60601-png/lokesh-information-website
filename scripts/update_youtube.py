import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime, timezone


CHANNEL_ID = "UCVzNbULO0EWDiHTgUTprZ6Q"
CHANNEL_HANDLE = "@Lokeshinfo53"

ROOT = Path(__file__).resolve().parent.parent
VIDEOS_FILE = ROOT / "videos.json"
CHANNEL_FILE = ROOT / "channel.json"


# =========================================
# INSTALL YT-DLP
# =========================================

def install_yt_dlp():

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


# =========================================
# DATE HELPERS
# =========================================

def timestamp_to_date(timestamp):

    if not timestamp:
        return ""

    try:

        timestamp = float(timestamp)

        dt = datetime.fromtimestamp(
            timestamp,
            tz=timezone.utc
        )

        return dt.strftime("%Y-%m-%d")

    except Exception:
        return ""


def normalize_date(value):

    if not value:
        return ""

    value = str(value).strip()

    # YYYYMMDD
    if len(value) == 8 and value.isdigit():

        return (
            value[0:4]
            + "-"
            + value[4:6]
            + "-"
            + value[6:8]
        )

    # YYYY-MM-DD
    if len(value) == 10:

        try:

            datetime.strptime(
                value,
                "%Y-%m-%d"
            )

            return value

        except Exception:
            pass

    # ISO datetime
    if len(value) >= 10:

        try:

            datetime.fromisoformat(
                value.replace("Z", "+00:00")
            )

            return value

        except Exception:
            pass

    return ""


def get_entry_date(entry):

    if not entry:
        return ""

    # Exact upload date
    date = normalize_date(
        entry.get("upload_date")
    )

    if date:
        return date

    # Upload timestamp
    date = timestamp_to_date(
        entry.get("timestamp")
    )

    if date:
        return date

    # Release date
    date = normalize_date(
        entry.get("release_date")
    )

    if date:
        return date

    # Release timestamp
    date = timestamp_to_date(
        entry.get("release_timestamp")
    )

    if date:
        return date

    # Original publication date
    date = normalize_date(
        entry.get("published")
    )

    if date:
        return date

    # Published timestamp
    date = timestamp_to_date(
        entry.get("published_timestamp")
    )

    if date:
        return date

    return ""


# =========================================
# FETCH YOUTUBE TAB
# =========================================

def fetch_channel_tab(tab):

    channel_url = (
        f"https://www.youtube.com/"
        f"{CHANNEL_HANDLE}/{tab}"
    )

    command = [
        sys.executable,
        "-m",
        "yt_dlp",

        "--flat-playlist",

        "--extractor-args",
        "youtubetab:approximate_date",

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

        print(
            f"Warning: Could not fetch {tab}"
        )

        print(
            result.stderr[:1000]
        )

        return []

    try:

        data = json.loads(
            result.stdout
        )

    except json.JSONDecodeError:

        print(
            f"Warning: Could not read "
            f"{tab} response."
        )

        return []

    entries = (
        data.get("entries", [])
        or []
    )

    print(
        f"{tab}: "
        f"{len(entries)} entries found."
    )

    return entries


# =========================================
# ENTRY → VIDEO OBJECT
# =========================================

def entry_to_video(entry, video_type):

    if not entry:
        return None

    video_id = entry.get("id")

    if not video_id:
        return None

    title = (
        entry.get("title")
        or "YouTube Video"
    )

    published = get_entry_date(
        entry
    )

    video = {
        "id": video_id,

        "title": title,

        "url":
            f"https://www.youtube.com/"
            f"watch?v={video_id}",

        "thumbnail":
            f"https://i.ytimg.com/"
            f"vi/{video_id}/hqdefault.jpg",

        "published": published,

        "publishedAt": published,

        "uploadDate": published,

        "type": video_type
    }

    return video


# =========================================
# GET ALL YOUTUBE CONTENT
# =========================================

def get_all_videos():

    normal_entries = (
        fetch_channel_tab("videos")
    )

    short_entries = (
        fetch_channel_tab("shorts")
    )

    live_entries = (
        fetch_channel_tab("streams")
    )

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

    # =================================
    # NORMAL VIDEOS
    # =================================

    for entry in normal_entries:

        if not entry:
            continue

        video_id = entry.get("id")

        if not video_id:
            continue

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

    # =================================
    # SHORTS
    # =================================

    for entry in short_entries:

        if not entry:
            continue

        video_id = entry.get("id")

        if not video_id:
            continue

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

    # =================================
    # LIVE
    # =================================

    for entry in live_entries:

        if not entry:
            continue

        video_id = entry.get("id")

        if not video_id:
            continue

        if video_id in seen:
            continue

        video = entry_to_video(
            entry,
            "live"
        )

        if video:

            videos.append(video)

            seen.add(video_id)

    if not videos:

        raise RuntimeError(
            "No videos, shorts or live streams "
            "were found. Existing videos.json "
            "was not replaced."
        )

    print("-----------------------------------")

    print(
        f"Total content found: "
        f"{len(videos)}"
    )

    print(
        f"Normal videos: "
        f"{sum(1 for v in videos if v['type'] == 'video')}"
    )

    print(
        f"Shorts: "
        f"{sum(1 for v in videos if v['type'] == 'short')}"
    )

    print(
        f"Live streams: "
        f"{sum(1 for v in videos if v['type'] == 'live')}"
    )

    dated = sum(
        1
        for v in videos
        if v.get("published")
    )

    print(
        f"Items with date: {dated}"
    )

    print("-----------------------------------")

    return videos


# =========================================
# LOAD EXISTING VIDEOS
# =========================================

def load_existing_videos():

    if not VIDEOS_FILE.exists():
        return []

    try:

        with open(
            VIDEOS_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(file)

        videos = data.get(
            "videos",
            []
        )

        if isinstance(
            videos,
            list
        ):

            return videos

    except Exception as error:

        print(
            f"Could not read existing "
            f"videos.json: {error}"
        )

    return []


# =========================================
# MERGE NEW + OLD DATA
# =========================================

def merge_videos(
    new_videos,
    old_videos
):

    old_by_id = {}

    # =================================
    # INDEX OLD DATA
    # =================================

    for old_video in old_videos:

        if not isinstance(
            old_video,
            dict
        ):
            continue

        video_id = str(
            old_video.get("id", "")
        ).strip()

        if video_id:
            old_by_id[video_id] = old_video

    merged = []

    seen = set()

    # =================================
    # NEW DATA FIRST
    # =================================

    for new_video in new_videos:

        if not isinstance(
            new_video,
            dict
        ):
            continue

        video_id = str(
            new_video.get("id", "")
        ).strip()

        if not video_id:
            continue

        if video_id in seen:
            continue

        old_video = old_by_id.get(
            video_id
        )

        # Make a copy
        video = dict(new_video)

        # =================================
        # KEEP OLD DATE IF NEW DATE EMPTY
        # =================================

        new_date = (
            video.get("published")
            or video.get("publishedAt")
            or video.get("uploadDate")
            or ""
        )

        old_date = ""

        if old_video:

            old_date = (
                old_video.get("uploadDate")
                or old_video.get("publishedAt")
                or old_video.get("published")
                or ""
            )

        final_date = (
            normalize_date(new_date)
            or normalize_date(old_date)
            or new_date
            or old_date
            or ""
        )

        # =================================
        # DATE FIELDS
        # =================================

        video["published"] = final_date

        video["publishedAt"] = final_date

        video["uploadDate"] = final_date

        # =================================
        # KEEP OLD DESCRIPTION IF AVAILABLE
        # =================================

        if (
            not video.get("description")
            and old_video
            and old_video.get("description")
        ):

            video["description"] = (
                old_video["description"]
            )

        # =================================
        # KEEP OLD TYPE IF NEEDED
        # =================================

        if video.get("type") not in [
            "video",
            "short",
            "live"
        ]:

            if old_video and old_video.get(
                "type"
            ) in [
                "video",
                "short",
                "live"
            ]:

                video["type"] = (
                    old_video["type"]
                )

            else:

                video["type"] = "video"

        merged.append(video)

        seen.add(video_id)

    # =================================
    # ADD OLD VIDEOS NOT FOUND NOW
    # =================================

    for old_video in old_videos:

        if not isinstance(
            old_video,
            dict
        ):
            continue

        video_id = str(
            old_video.get("id", "")
        ).strip()

        if not video_id:
            continue

        if video_id in seen:
            continue

        video = dict(old_video)

        # =================================
        # DATE COMPATIBILITY
        # =================================

        final_date = (
            normalize_date(
                video.get("uploadDate")
            )
            or normalize_date(
                video.get("publishedAt")
            )
            or normalize_date(
                video.get("published")
            )
            or ""
        )

        video["published"] = final_date

        video["publishedAt"] = final_date

        video["uploadDate"] = final_date

        # =================================
        # TYPE
        # =================================

        if video.get("type") not in [
            "video",
            "short",
            "live"
        ]:

            video["type"] = "video"

        merged.append(video)

        seen.add(video_id)

    return merged


# =========================================
# SAVE VIDEOS
# =========================================

def save_videos(videos):

    data = {
        "videos": videos
    }

    temporary_file = (
        VIDEOS_FILE.with_suffix(
            ".json.tmp"
        )
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

    temporary_file.replace(
        VIDEOS_FILE
    )

    print(
        f"Saved {len(videos)} "
        f"content items to videos.json"
    )


# =========================================
# SAVE CHANNEL
# =========================================

def save_channel(channel_id):

    uploads_playlist_id = ""

    if channel_id.startswith("UC"):

        uploads_playlist_id = (
            "UU"
            + channel_id[2:]
        )

    data = {

        "channelId":
            channel_id,

        "uploadsPlaylistId":
            uploads_playlist_id,

        "channelUrl":
            "https://www.youtube.com/channel/"
            + channel_id,

        "handle":
            CHANNEL_HANDLE
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

    print(
        "Saved channel.json"
    )


# =========================================
# VALIDATE VIDEOS
# =========================================

def validate_videos(videos):

    required_fields = [
        "id",
        "title",
        "url",
        "thumbnail"
    ]

    valid_videos = []

    for video in videos:

        if not isinstance(
            video,
            dict
        ):
            continue

        if not all(
            video.get(field)
            for field in required_fields
        ):
            continue

        # =================================
        # DATE NORMALIZATION
        # =================================

        published = (
            video.get("uploadDate")
            or video.get("publishedAt")
            or video.get("published")
            or video.get("date")
            or ""
        )

        normalized = (
            normalize_date(published)
        )

        final_date = (
            normalized
            or published
            or ""
        )

        video["published"] = final_date

        video["publishedAt"] = final_date

        video["uploadDate"] = final_date

        # =================================
        # TYPE
        # =================================

        if video.get("type") not in [
            "video",
            "short",
            "live"
        ]:

            video["type"] = "video"

        valid_videos.append(
            video
        )

    print(
        f"Validation: "
        f"{len(valid_videos)} valid items "
        f"out of {len(videos)}"
    )

    print(
        "Items with uploadDate: "
        f"{sum(1 for v in valid_videos if v.get('uploadDate'))}"
    )

    return valid_videos


# =========================================
# MAIN
# =========================================

def main():

    print("===================================")

    print(
        "Starting YouTube sync..."
    )

    print("===================================")

    install_yt_dlp()

    old_videos = (
        load_existing_videos()
    )

    print(
        f"Existing videos: "
        f"{len(old_videos)}"
    )

    new_videos = (
        get_all_videos()
    )

    videos = merge_videos(
        new_videos,
        old_videos
    )

    print(
        f"After merge: "
        f"{len(videos)} content items"
    )

    videos = validate_videos(
        videos
    )

    if not videos:

        raise RuntimeError(
            "No valid videos found. "
            "Website data was not replaced."
        )

    save_videos(
        videos
    )

    save_channel(
        CHANNEL_ID
    )

    print("===================================")

    print(
        "YouTube sync completed successfully."
    )

    print(
        f"Total content: "
        f"{len(videos)}"
    )

    print(
        f"Videos: "
        f"{sum(1 for v in videos if v['type'] == 'video')}"
    )

    print(
        f"Shorts: "
        f"{sum(1 for v in videos if v['type'] == 'short')}"
    )

    print(
        f"Live: "
        f"{sum(1 for v in videos if v['type'] == 'live')}"
    )

    print(
        f"With uploadDate: "
        f"{sum(1 for v in videos if v.get('uploadDate'))}"
    )

    print("===================================")


if __name__ == "__main__":
    main()
