import json
import html
from pathlib import Path
from datetime import datetime


ROOT = Path(__file__).resolve().parent.parent

VIDEOS_FILE = ROOT / "videos.json"
VIDEOOBJECTS_FILE = ROOT / "videoobjects.json"

VIDEOS_DIR = ROOT / "videos"
SHORTS_DIR = ROOT / "shorts"
LIVE_DIR = ROOT / "live"

SITE_URL = (
    "https://raksha60601-png.github.io/"
    "lokesh-information-website"
)


# =========================================
# HELPERS
# =========================================

def esc(value):
    return html.escape(str(value or ""), quote=True)


def normalize_date(value):

    if not value:
        return ""

    value = str(value).strip()

    if not value:
        return ""

    if len(value) == 10:
        try:
            datetime.strptime(value, "%Y-%m-%d")
            return value + "T00:00:00+00:00"
        except Exception:
            pass

    try:
        return datetime.fromisoformat(
            value.replace("Z", "+00:00")
        ).isoformat()
    except Exception:
        return ""


def get_date(item):

    if not isinstance(item, dict):
        return ""

    fields = [
        "uploadDate",
        "upload_date",
        "publishedAt",
        "published_at",
        "published",
        "datePublished",
        "date",
        "createdAt",
        "created_at"
    ]

    for field in fields:

        value = item.get(field)

        date = normalize_date(value)

        if date:
            return date

    return ""


# =========================================
# LOAD VIDEOOBJECT DATES
# =========================================

def load_videoobject_dates():

    result = {}

    if not VIDEOOBJECTS_FILE.exists():
        return result

    try:

        with open(
            VIDEOOBJECTS_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(file)

    except Exception as error:

        print(
            "Could not load videoobjects.json:",
            error
        )

        return result

    if isinstance(data, list):

        items = data

    elif isinstance(data, dict):

        items = (
            data.get("videos")
            or data.get("videoObjects")
            or data.get("videoobjects")
            or []
        )

    else:

        items = []

    for item in items:

        if not isinstance(item, dict):
            continue

        video_id = str(
            item.get("id")
            or item.get("videoId")
            or item.get("video_id")
            or ""
        ).strip()

        if not video_id:
            continue

        date = get_date(item)

        if date:
            result[video_id] = date

    print(
        "VideoObject dates loaded:",
        len(result)
    )

    return result


# =========================================
# GET FINAL DATE
# =========================================

def get_final_date(video, date_map):

    date = get_date(video)

    if date:
        return date

    video_id = str(
        video.get("id", "")
    ).strip()

    return date_map.get(
        video_id,
        ""
    )


# =========================================
# CREATE WATCH PAGE
# =========================================

def create_watch_page(video, output_file, date_map):

    video_id = str(
        video.get("id", "")
    ).strip()

    if not video_id:
        return False

    title = str(
        video.get(
            "title",
            "Lokesh Information Video"
        )
    ).strip()

    description = str(
        video.get(
            "description",
            ""
        )
    ).strip()

    if not description:

        description = (
            f"{title}. "
            "Lokesh Information पर Tech News, "
            "Smartphones, Gadgets, Apps, AI Tools "
            "और practical technology tutorials "
            "आसान Hindi और Hinglish में।"
        )

    thumbnail = str(
        video.get(
            "thumbnail",
            f"https://i.ytimg.com/vi/"
            f"{video_id}/hqdefault.jpg"
        )
    ).strip()

    video_url = (
        f"https://www.youtube.com/watch?v="
        f"{video_id}"
    )

    embed_url = (
        f"https://www.youtube-nocookie.com/"
        f"embed/{video_id}"
    )

    page_url = (
        f"{SITE_URL}/{output_file.relative_to(ROOT).as_posix()}"
    )

    upload_date = get_final_date(
        video,
        date_map
    )

    video_type = video.get(
        "type",
        "video"
    )

    # =====================================
    # VIDEOOBJECT
    # =====================================

    schema = {

        "@context":
            "https://schema.org",

        "@type":
            "VideoObject",

        "name":
            title,

        "description":
            description,

        "thumbnailUrl": [
            thumbnail
        ],

        "embedUrl":
            embed_url,

        "url":
            page_url,

        "publisher": {

            "@type":
                "Organization",

            "name":
                "Lokesh Information",

            "logo": {

                "@type":
                    "ImageObject",

                "url":
                    f"{SITE_URL}/assets/"
                    "lokesh-information-dp.png"
            }
        },

        "author": {

            "@type":
                "Person",

            "name":
                "Lokesh Information"
        }
    }

    # IMPORTANT:
    # Only add uploadDate when we actually
    # have a real date. Never invent one.

    if upload_date:

        schema["uploadDate"] = upload_date

    # =====================================
    # LIVE
    # =====================================

    if video_type == "live" and upload_date:

        schema["publication"] = {

            "@type":
                "BroadcastEvent",

            "isLiveBroadcast":
                False,

            "startDate":
                upload_date
        }

    schema_json = json.dumps(
        schema,
        ensure_ascii=False,
        indent=2
    )

    # =====================================
    # PAGE HTML
    # =====================================

    html_page = f"""<!doctype html>
<html lang="hi">

<head>

  <meta charset="utf-8">

  <title>{esc(title)} | Lokesh Information</title>

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >

  <meta
    name="description"
    content="{esc(description[:300])}"
  >

  <meta
    name="robots"
    content="index, follow, max-video-preview:-1"
  >

  <link
    rel="canonical"
    href="{esc(page_url)}"
  >

  <link
    rel="icon"
    type="image/png"
    href="../assets/lokesh-information-dp.png"
  >

  <link
    rel="stylesheet"
    href="../style.css"
  >

  <script type="application/ld+json">
{schema_json}
  </script>

</head>

<body>

<header>

  <a
    class="brand"
    href="../index.html"
  >

    <img
      src="../assets/lokesh-information-dp.png"
      alt="Lokesh Information"
      width="56"
      height="56"
    >

    <span>
      <strong>Lokesh Information</strong>
      <small>Tech • News • Gadgets</small>
    </span>

  </a>

  <nav>

    <a href="../index.html">Home</a>
    <a href="../videos.html">Videos</a>
    <a href="../shorts.html">Shorts</a>
    <a href="../live.html">Live</a>

  </nav>

</header>


<main>

<section class="about">

  <div>

    <span>VIDEO</span>

    <h1>
      {esc(title)}
    </h1>

    <p>
      {esc(description)}
    </p>

  </div>

</section>


<section id="video-watch">

  <div class="youtube-frame">

    <iframe
      src="{esc(embed_url)}?rel=0"
      title="{esc(title)}"
      loading="eager"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen>
    </iframe>

  </div>

</section>


<section class="about">

  <div>

    <h2>
      Watch on YouTube
    </h2>

    <p>
      यह वीडियो Lokesh Information के
      official YouTube channel से है।
    </p>

    <a
      class="btn red"
      href="{esc(video_url)}"
      target="_blank"
      rel="noopener noreferrer"
    >
      ▶ Watch on YouTube
    </a>

    <a
      class="btn"
      href="../index.html"
    >
      ← Back to Lokesh Information
    </a>

  </div>

</section>

</main>


<footer>

  <div class="footer-brand">

    <strong>
      Lokesh Information
    </strong>

    <p>
      Tech • News • Gadgets • Apps • AI
    </p>

  </div>

  <small>
    © 2026 Lokesh Information.
    All rights reserved.
  </small>

</footer>

</body>

</html>
"""

    output_file.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with open(
        output_file,
        "w",
        encoding="utf-8"
    ) as file:

        file.write(html_page)

    return True


# =========================================
# CREATE SITEMAP
# =========================================

def create_sitemap(pages):

    sitemap_file = ROOT / "sitemap.xml"

    today = datetime.utcnow().strftime(
        "%Y-%m-%d"
    )

    urls = []

    # Homepage

    urls.append(
        f"""
  <url>
    <loc>{SITE_URL}/</loc>
    <lastmod>{today}</lastmod>
  </url>"""
    )

    # Individual video pages

    for page in pages:

        relative = page.relative_to(
            ROOT
        ).as_posix()

        urls.append(
            f"""
  <url>
    <loc>{SITE_URL}/{relative}</loc>
    <lastmod>{today}</lastmod>
  </url>"""
        )

    sitemap = f"""<?xml version="1.0" encoding="UTF-8"?>

<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>

{"".join(urls)}

</urlset>
"""

    with open(
        sitemap_file,
        "w",
        encoding="utf-8"
    ) as file:

        file.write(sitemap)

    print(
        "Sitemap created:",
        sitemap_file
    )


# =========================================
# MAIN
# =========================================

def main():

    print(
        "==================================="
    )

    print(
        "Generating individual video pages..."
    )

    print(
        "==================================="
    )

    if not VIDEOS_FILE.exists():

        raise RuntimeError(
            "videos.json not found."
        )

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

    if not isinstance(
        videos,
        list
    ):

        raise RuntimeError(
            "videos.json has invalid format."
        )

    date_map = (
        load_videoobject_dates()
    )

    pages = []

    counts = {
        "video": 0,
        "short": 0,
        "live": 0
    }

    seen = set()

    for video in videos:

        if not isinstance(
            video,
            dict
        ):
            continue

        video_id = str(
            video.get("id", "")
        ).strip()

        if not video_id:
            continue

        if video_id in seen:
            continue

        seen.add(video_id)

        video_type = video.get(
            "type",
            "video"
        )

        if video_type == "short":

            output_file = (
                SHORTS_DIR
                / f"{video_id}.html"
            )

        elif video_type == "live":

            output_file = (
                LIVE_DIR
                / f"{video_id}.html"
            )

        else:

            output_file = (
                VIDEOS_DIR
                / f"{video_id}.html"
            )

            video_type = "video"

        success = create_watch_page(
            video,
            output_file,
            date_map
        )

        if success:

            pages.append(
                output_file
            )

            counts[
                video_type
            ] += 1

    create_sitemap(
        pages
    )

    print(
        "-----------------------------------"
    )

    print(
        "Individual pages generated:",
        len(pages)
    )

    print(
        "Normal videos:",
        counts["video"]
    )

    print(
        "Shorts:",
        counts["short"]
    )

    print(
        "Live:",
        counts["live"]
    )

    print(
        "Pages with dates:",
        sum(
            1
            for video in videos
            if get_final_date(
                video,
                date_map
            )
        )
    )

    print(
        "-----------------------------------"
    )


if __name__ == "__main__":
    main()
