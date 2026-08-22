import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

CHANNEL_HANDLE = "@Lokeshinfo53"
ROOT = Path(__file__).resolve().parent.parent


def fetch(url):
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0"}
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def find_channel_id():
    url = "https://www.youtube.com/" + CHANNEL_HANDLE
    html = fetch(url).decode("utf-8", errors="ignore")

    patterns = [
        r'"channelId":"(UC[a-zA-Z0-9_-]+)"',
        r'"externalId":"(UC[a-zA-Z0-9_-]+)"',
        r'"browseId":"(UC[a-zA-Z0-9_-]+)"'
    ]

    for pattern in patterns:
        match = re.search(pattern, html)
        if match:
            return match.group(1)

    raise RuntimeError("YouTube Channel ID नहीं मिला।")


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
                "url": "https://www.youtube.com/watch?v=" + video_id,
                "thumbnail": (
                    "https://i.ytimg.com/vi/"
                    + video_id
                    + "/hqdefault.jpg"
                ),
                "published": published
            })

    return videos


def main():
    channel_id = find_channel_id()
    videos = get_videos(channel_id)

   
