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
VIDEOOBJECTS_FILE = ROOT / "videoobjects.json"


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

            dt = datetime.fromisoformat(
                value.replace("Z", "+00:00")
            )

            if dt.tzinfo is None:
                dt = dt.replace(
                    tzinfo=timezone.utc
                )

            return dt.isoformat()

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

    # Timestamp
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

    return ""


# =========================================
# FETCH EXACT VIDEO DATE
# =========================================

def fetch_exact_video_date(video_id):

    if not video_id:
        return ""

    video_url = (
        "https://www.youtube.com/watch?v="
        + video_id
    )

    command = [
        sys.executable,
        "-m",
        "yt_dlp",

        "--skip-download",
        "--no-warnings",
        "--ignore-errors",
        "--no-playlist",
        "--dump-single-json",

        video_url
    ]

    try:

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode != 0:
            return ""

        data = json.loads(
            result.stdout
        )

        date = get_entry_date(data)

        if date:
            return date

    except Exception as error:

        print(
            f"Could not get exact date "
            f"for {video_id}: {error}"
        )

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

    print()
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

       
