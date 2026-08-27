/* =========================================
   LOKESH INFORMATION
   YouTube Videos / Shorts / Live

   DATA SOURCE:
   videos.json

   VIDEO SEO:
   JSON-LD VideoObject

   IMPORTANT:
   VideoObject is generated ONLY as JSON-LD.
   HTML microdata is NOT used.
========================================= */


/* =========================================
   MOBILE MENU
========================================= */

const header = document.querySelector("header");
const menu = document.querySelector(".menu");

menu?.addEventListener("click", () => {
  header?.classList.toggle("nav-open");
});

document.querySelectorAll("nav a").forEach((a) => {
  a.addEventListener("click", () => {
    header?.classList.remove("nav-open");
  });
});


/* =========================================
   HELPERS
========================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================
   NORMALIZE DATE
========================================= */

function normalizeUploadDate(value) {

  if (!value) {
    return null;
  }

  const dateString = String(value).trim();

  if (!dateString) {
    return null;
  }


  /* YYYY-MM-DD */

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return `${dateString}T00:00:00Z`;
  }


  /* ISO DATE */

  if (/^\d{4}-\d{2}-\d{2}T/.test(dateString)) {

    const parsed = new Date(dateString);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }


  /* Other valid date */

  const parsed = new Date(dateString);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }


  return null;
}


/* =========================================
   GET VIDEO DATE
========================================= */

function getVideoDate(video) {

  if (!video || typeof video !== "object") {
    return null;
  }

  const possibleDates = [

    video.uploadDate,
    video.upload_date,

    video.publishedAt,
    video.published_at,

    video.published,

    video.date,
    video.datePublished,

    video.createdAt,
    video.created_at

  ];


  for (const value of possibleDates) {

    const normalized = normalizeUploadDate(value);

    if (normalized) {
      return normalized;
    }
  }


  return null;
}


/* =========================================
   GET VIDEO ID
========================================= */

function getVideoId(video) {

  if (!video || typeof video !== "object") {
    return "";
  }


  const possibleIds = [

    video.id,
    video.videoId,
    video.video_id,
    video.youtubeId,
    video.youtube_id

  ];


  for (const value of possibleIds) {

    if (!value) {
      continue;
    }

    const id = String(value).trim();

    if (/^[A-Za-z0-9_-]{6,}$/.test(id)) {
      return id;
    }
  }


  const possibleUrls = [

    video.url,
    video.videoUrl,
    video.youtubeUrl,
    video.link

  ];


  for (const value of possibleUrls) {

    if (!value) {
      continue;
    }

    const url = String(value).trim();

    const match = url.match(
      /(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/
    );

    if (match && match[1]) {
      return match[1];
    }
  }


  return "";
}


/* =========================================
   REMOVE OLD VIDEO JSON-LD
========================================= */

function removeVideoSEO() {

  document
    .querySelectorAll('script[data-video-seo="true"]')
    .forEach((element) => {
      element.remove();
    });

}


/* =========================================
   CREATE VIDEO SEO
========================================= */

function addVideoSEO(videos) {

  removeVideoSEO();


  if (!Array.isArray(videos) || !videos.length) {

    console.log("No videos available for VideoObject SEO.");

    return;
  }


  const seen = new Set();

  let seoCount = 0;


  videos.forEach((video) => {

    if (!video || typeof video !== "object") {
      return;
    }


    const id = getVideoId(video);

    const uploadDate = getVideoDate(video);


    /* -----------------------------------------
       VideoObject requires ID + uploadDate
    ----------------------------------------- */

    if (!id || !uploadDate) {
      return;
    }


    /* -----------------------------------------
       Prevent duplicate VideoObjects
    ----------------------------------------- */

    if (seen.has(id)) {
      return;
    }

    seen.add(id);


    const title = String(
      video.title ||
      "Lokesh Information Video"
    ).trim();


    const description = String(
      video.description ||
      `${title}. Lokesh Information पर Tech News, Smartphones, Gadgets, Apps, AI Tools और Technology की जानकारी आसान Hindi और Hinglish में।`
    ).trim();


    const thumbnail =
      video.thumbnail ||
      `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;


    const videoUrl =
      `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;


    const embedUrl =
      `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;


    /* -----------------------------------------
       VIDEO OBJECT
    ----------------------------------------- */

    const schema = {

      "@context": "https://schema.org",

      "@type": "VideoObject",

      "@id":
        `${window.location.origin}${window.location.pathname}#video-${id}`,

      "name":
        title,

      "description":
        description,

      "thumbnailUrl": [
        thumbnail
      ],

      "uploadDate":
        uploadDate,

      "embedUrl":
        embedUrl,

      "url":
        videoUrl,

      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href
      },

      "publisher": {

        "@type": "Organization",

        "name":
          "Lokesh Information",

        "url":
          "https://raksha60601-png.github.io/lokesh-information-website/",

        "logo": {

          "@type": "ImageObject",

          "url":
            "https://raksha60601-png.github.io/lokesh-information-website/assets/lokesh-information-dp.png"

        }

      }

    };


    /* -----------------------------------------
       OPTIONAL DURATION
    ----------------------------------------- */

    if (video.duration) {

      schema.duration =
        String(video.duration).trim();

    }


    /* -----------------------------------------
       LIVE VIDEO
    ----------------------------------------- */

    if (video.type === "live") {

      schema.publication = {

        "@type": "BroadcastEvent",

        "isLiveBroadcast": false,

        "startDate": uploadDate

      };

    }


    /* -----------------------------------------
       CREATE JSON-LD SCRIPT
    ----------------------------------------- */

    const script =
      document.createElement("script");


    script.type =
      "application/ld+json";


    script.dataset.videoSeo =
      "true";


    script.textContent =
      JSON.stringify(schema);


    document.head.appendChild(script);


    seoCount++;

  });


  console.log(
    "VideoObject JSON-LD created:",
    seoCount
  );

}


/* =========================================
   CREATE VIDEO CARD
========================================= */

function videoCard(video) {

  const id =
    getVideoId(video);

  if (!id) {
    return "";
  }

  const title =
    escapeHTML(
      video.title ||
      "Lokesh Information Video"
    );

  const description =
    escapeHTML(
      video.description ||
      ""
    );

  const type =
    video.type ||
    "video";

  const typeClass =
    type === "short"
      ? "short-card"
      : type === "live"
      ? "live-card"
      : "video-card";

  const thumbnail =
    video.thumbnail ||
    `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;

  const embedUrl =
    `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;

  return `

    <article
      class="youtube-card ${typeClass}"
    >

      <div class="youtube-frame">

        <iframe
          src="${embedUrl}?rel=0"
          title="${title}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>

      </div>

      <div class="youtube-card-title">
        ${title}
      </div>

    </article>

  `;
}


/* =========================================
   RENDER GRID
========================================= */

function renderGrid(
  element,
  videos,
  limit = 6
) {

  if (!element) {
    return;
  }


  const visibleVideos =
    limit === Infinity
      ? videos
      : videos.slice(0, limit);


  if (!visibleVideos.length) {

    element.innerHTML = `
      <div class="loading">
        अभी कोई video उपलब्ध नहीं है।
      </div>
    `;

    return;
  }


  element.innerHTML =
    visibleVideos
      .map(videoCard)
      .join("");

}


/* =========================================
   UPDATE COUNT
========================================= */

function updateCount(
  elementId,
  count,
  text
) {

  const element =
    document.getElementById(elementId);


  if (!element) {
    return;
  }


  element.textContent =
    `${count} ${text}`;

}


/* =========================================
   MAIN YOUTUBE LOADER
========================================= */

async function loadYouTube() {

  const videosGrid =
    document.getElementById("videosGrid");

  const liveGrid =
    document.getElementById("liveGrid");

  const shortsGrid =
    document.getElementById("shortsGrid");


  if (
    !videosGrid ||
    !liveGrid ||
    !shortsGrid
  ) {

    console.warn(
      "YouTube grids not found."
    );

    return;
  }


  try {

    const response =
      await fetch(
        `videos.json?ts=${Date.now()}`,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `videos.json returned ${response.status}`
      );

    }


    const data =
      await response.json();


    const allVideos =
      Array.isArray(data.videos)
        ? data.videos
        : [];


    /* =====================================
       REMOVE DUPLICATES
    ===================================== */

    const uniqueVideos = [];

    const seen = new Set();


    allVideos.forEach((video) => {

      if (
        !video ||
        typeof video !== "object"
      ) {

        return;
      }


      const id =
        getVideoId(video);


      if (!id || seen.has(id)) {
        return;
      }


      seen.add(id);


      uniqueVideos.push({
        ...video,
        id
      });

    });


    /* =====================================
       SEPARATE CONTENT
    ===================================== */

    const normalVideos =
      uniqueVideos.filter(
        video =>
          video.type === "video" ||
          !video.type
      );


    const liveVideos =
      uniqueVideos.filter(
        video =>
          video.type === "live"
      );


    const shorts =
      uniqueVideos.filter(
        video =>
          video.type === "short"
      );


    /* =====================================
       SHOW LATEST 6
    ===================================== */

    renderGrid(
      videosGrid,
      normalVideos,
      6
    );


    renderGrid(
      liveGrid,
      liveVideos,
      6
    );


    renderGrid(
      shortsGrid,
      shorts,
      6
    );


    /* =====================================
       COUNTS
    ===================================== */

    updateCount(
      "videoCount",
      normalVideos.length,
      "Videos"
    );


    updateCount(
      "liveCount",
      liveVideos.length,
      "Live streams"
    );


    updateCount(
      "shortCount",
      shorts.length,
      "Shorts"
    );


    /* =====================================
       VIDEO SEO
    ===================================== */

    addVideoSEO(uniqueVideos);


    /* =====================================
       VIEW ALL
    ===================================== */

    setupViewAll(
      "videos",
      "VIDEOS",
      "All Videos",
      normalVideos
    );


    setupViewAll(
      "live",
      "LIVE",
      "All Live Streams",
      liveVideos
    );


    setupViewAll(
      "shorts",
      "SHORTS",
      "All Shorts",
      shorts
    );


    /* =====================================
       CONSOLE
    ===================================== */

    console.log(
      "YouTube sync successful"
    );


    console.log(
      "Total content:",
      uniqueVideos.length
    );


    console.log(
      "Videos:",
      normalVideos.length
    );


    console.log(
      "Live:",
      liveVideos.length
    );


    console.log(
      "Shorts:",
      shorts.length
    );


    console.log(
      "Videos with uploadDate:",
      uniqueVideos.filter(
        video => getVideoDate(video)
      ).length
    );


  }
  catch (error) {

    console.error(
      "Could not load YouTube videos:",
      error
    );


    videosGrid.innerHTML = `
      <div class="loading">
        Videos अभी load नहीं हो सकीं।
      </div>
    `;


    liveGrid.innerHTML = `
      <div class="loading">
        Live videos अभी load नहीं हो सकीं।
      </div>
    `;


    shortsGrid.innerHTML = `
      <div class="loading">
        Shorts अभी load नहीं हो सके।
      </div>
    `;

  }

}


/* =========================================
   VIEW ALL
========================================= */

function setupViewAll(
  section,
  label,
  title,
  videos
) {

  const button =
    document.querySelector(
      `.view-all-btn[data-section="${section}"]`
    );


  if (!button) {
    return;
  }


  button.onclick = () => {

    const fullView =
      document.getElementById(
        "youtubeFullView"
      );


    const fullViewGrid =
      document.getElementById(
        "fullViewGrid"
      );


    const fullViewLabel =
      document.getElementById(
        "fullViewLabel"
      );


    const fullViewTitle =
      document.getElementById(
        "fullViewTitle"
      );


    if (
      !fullView ||
      !fullViewGrid ||
      !fullViewLabel ||
      !fullViewTitle
    ) {

      return;
    }


    fullViewLabel.textContent =
      label;


    fullViewTitle.textContent =
      title;


    fullViewGrid.innerHTML =
      videos.length

        ? videos
            .map(videoCard)
            .join("")

        : `
          <div class="loading">
            इस category में अभी कोई content नहीं है।
          </div>
        `;


    fullView.hidden =
      false;


    document
      .querySelectorAll(
        ".youtube-category"
      )
      .forEach(
        sectionElement => {

          sectionElement.style.display =
            "none";

        }
      );


    fullView.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  };

}


/* =========================================
   BACK BUTTON
========================================= */

const backButton =
  document.getElementById(
    "backToYoutubeSections"
  );


backButton?.addEventListener(
  "click",
  () => {

    const fullView =
      document.getElementById(
        "youtubeFullView"
      );


    if (fullView) {

      fullView.hidden =
        true;

    }


    document
      .querySelectorAll(
        ".youtube-category"
      )
      .forEach(
        sectionElement => {

          sectionElement.style.display =
            "";

        }
      );


    document
      .getElementById(
        "videos"
      )
      ?.scrollIntoView({
        behavior: "smooth"
      });

  }
);


/* =========================================
   FIRST LOAD
========================================= */

loadYouTube();


/* =========================================
   AUTO REFRESH
   Every 5 Minutes
========================================= */

setInterval(
  loadYouTube,
  5 * 60 * 1000
);
