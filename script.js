/* =========================================
   LOKESH INFORMATION
   YouTube Videos / Shorts / Live
   Dynamic Video SEO + Auto Refresh

   IMPORTANT:
   - videos.json = YouTube video data
   - videoobjects.json = SEO dates / VideoObject data
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

  const dateString =
    String(value).trim();

  if (!dateString) {
    return null;
  }

  /*
    Accept:
    2026-08-20
    2026-08-20T10:30:00+05:30
    2026-08-20T10:30:00Z
  */

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(dateString)
  ) {
    return `${dateString}T00:00:00+05:30`;
  }


  if (
    /^\d{4}-\d{2}-\d{2}T/.test(dateString)
  ) {
    return dateString;
  }


  const parsed =
    new Date(dateString);


  if (
    !Number.isNaN(
      parsed.getTime()
    )
  ) {

    return parsed.toISOString();

  }


  return null;
}


/* =========================================
   GET VIDEO ID FROM ANY OBJECT
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
    video.youtube_id,
    video.name
  ];


  for (const value of possibleIds) {

    if (!value) {
      continue;
    }


    const id =
      String(value).trim();


    /*
      Normal YouTube ID
      Usually 11 characters.
    */

    if (
      /^[A-Za-z0-9_-]{6,}$/.test(id)
    ) {
      return id;
    }

  }


  /*
    Try extracting ID from YouTube URL
  */

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


    const url =
      String(value).trim();


    const match =
      url.match(
        /(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/
      );


    if (match && match[1]) {
      return match[1];
    }

  }


  return "";

}


/* =========================================
   GET DATE FROM VIDEO OBJECT
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

    const normalized =
      normalizeUploadDate(value);


    if (normalized) {
      return normalized;
    }

  }


  return null;

}


/* =========================================
   LOAD SEO DATES
========================================= */

async function loadVideoObjectData() {

  try {

    const response =
      await fetch(
        `videoobjects.json?ts=${Date.now()}`,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `videoobjects.json returned ${response.status}`
      );

    }


    const data =
      await response.json();


    /*
      Support multiple possible structures:
      
      {
        "videos": [...]
      }

      OR

      {
        "videoObjects": [...]
      }

      OR

      [...]
    */

    let items = [];


    if (Array.isArray(data)) {

      items = data;

    }
    else if (
      Array.isArray(data.videos)
    ) {

      items = data.videos;

    }
    else if (
      Array.isArray(data.videoObjects)
    ) {

      items = data.videoObjects;

    }
    else if (
      Array.isArray(data.videoobjects)
    ) {

      items = data.videoobjects;

    }


    const dateMap =
      new Map();


    items.forEach((item) => {

      if (
        !item ||
        typeof item !== "object"
      ) {
        return;
      }


      const id =
        getVideoId(item);


      const date =
        getVideoDate(item);


      if (
        id &&
        date
      ) {

        dateMap.set(
          id,
          date
        );

      }

    });


    console.log(
      "VideoObject date records:",
      dateMap.size
    );


    return dateMap;


  }
  catch (error) {

    console.warn(
      "videoobjects.json could not be loaded:",
      error
    );


    return new Map();

  }

}


/* =========================================
   VIDEO SEO
========================================= */

function addVideoSEO(videos) {

  /*
    Remove old dynamically generated
    VideoObject scripts.
  */

  document
    .querySelectorAll(
      'script[data-video-seo="true"]'
    )
    .forEach(
      (element) => element.remove()
    );


  if (
    !Array.isArray(videos) ||
    !videos.length
  ) {

    return;

  }


  /*
    Google SEO data for latest 20 videos
  */

  const validVideos =
    videos
      .filter(
        video =>
          video &&
          video.id
      )
      .slice(0, 20);


  const seen =
    new Set();


  validVideos.forEach((video) => {

    const id =
      String(video.id).trim();


    if (
      !id ||
      seen.has(id)
    ) {

      return;

    }


    seen.add(id);


    const title =
      String(
        video.title ||
        "Lokesh Information Video"
      ).trim();


    const description =
      String(
        video.description ||
        `${title}. Lokesh Information पर Tech News, Smartphones, Gadgets, Apps, AI Tools और Technology की जानकारी आसान Hindi और Hinglish में।`
      ).trim();


    const thumbnail =
      video.thumbnail ||
      `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;


    const uploadDate =
      getVideoDate(video);


    const videoUrl =
      `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;


    const embedUrl =
      `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;


    const schema = {

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
        embedUrl,

      "publisher": {

        "@type":
          "Organization",

        "name":
          "Lokesh Information",

        "logo": {

          "@type":
            "ImageObject",

          "url":
            "https://raksha60601-png.github.io/lokesh-information-website/assets/lokesh-information-dp.png"

        }

      },

      "author": {

        "@type":
          "Person",

        "name":
          "Lokesh Information"

      },

      "url":
        videoUrl

    };


    /*
      uploadDate is REQUIRED for Google VideoObject.
    */

    if (uploadDate) {

      schema.uploadDate =
        uploadDate;

    }


    /*
      Optional duration.
    */

    if (video.duration) {

      schema.duration =
        String(
          video.duration
        ).trim();

    }


    /*
      Live videos can additionally
      contain BroadcastEvent data.
    */

    if (
      video.type === "live"
    ) {

      const startDate =
        uploadDate ||
        getVideoDate(video);


      if (startDate) {

        schema.publication = {

          "@type":
            "BroadcastEvent",

          "isLiveBroadcast":
            false,

          "startDate":
            startDate

        };

      }

    }


    const script =
      document.createElement(
        "script"
      );


    script.type =
      "application/ld+json";


    script.dataset.videoSeo =
      "true";


    script.textContent =
      JSON.stringify(
        schema
      );


    document.head.appendChild(
      script
    );

  });

}


/* =========================================
   CREATE VIDEO CARD
========================================= */

function videoCard(video) {

  const id =
    String(
      video.id || ""
    ).trim();


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


  const publishedAt =
    getVideoDate(video) ||
    "";


  const embedUrl =
    `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;


  return `

    <article
      class="youtube-card ${typeClass}"
      itemscope
      itemtype="https://schema.org/VideoObject"
    >

      <meta
        itemprop="name"
        content="${title}"
      >

      ${
        description
          ? `
            <meta
              itemprop="description"
              content="${description}"
            >
          `
          : ""
      }


      <meta
        itemprop="thumbnailUrl"
        content="${escapeHTML(thumbnail)}"
      >


      ${
        publishedAt
          ? `
            <meta
              itemprop="uploadDate"
              content="${escapeHTML(publishedAt)}"
            >
          `
          : ""
      }


      <meta
        itemprop="embedUrl"
        content="${embedUrl}"
      >


      <meta
        itemprop="url"
        content="https://www.youtube.com/watch?v=${encodeURIComponent(id)}"
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


      <div
        class="youtube-card-title"
        itemprop="name"
      >
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


  if (
    !visibleVideos.length
  ) {

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
    document.getElementById(
      elementId
    );


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
    document.getElementById(
      "videosGrid"
    );

  const liveGrid =
    document.getElementById(
      "liveGrid"
    );

  const shortsGrid =
    document.getElementById(
      "shortsGrid"
    );


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

    /*
      Load both files.

      videos.json:
      Main YouTube content

      videoobjects.json:
      SEO upload dates
    */

    const [
      videosResponse,
      videoObjectDates
    ] = await Promise.all([

      fetch(
        `videos.json?ts=${Date.now()}`,
        {
          cache: "no-store"
        }
      ),

      loadVideoObjectData()

    ]);


    if (!videosResponse.ok) {

      throw new Error(
        `videos.json returned ${videosResponse.status}`
      );

    }


    const data =
      await videosResponse.json();


    const allVideos =
      Array.isArray(
        data.videos
      )
        ? data.videos
        : [];


    /* =====================================
       REMOVE DUPLICATES
    ===================================== */

    const uniqueVideos = [];

    const seen =
      new Set();


    allVideos.forEach(
      (video) => {

        if (
          !video ||
          typeof video !== "object"
        ) {

          return;

        }


        const id =
          String(
            video.id || ""
          ).trim();


        if (
          !id ||
          seen.has(id)
        ) {

          return;

        }


        seen.add(id);


        /*
          Find upload date from
          videoobjects.json if videos.json
          doesn't already contain one.
        */

        const existingDate =
          getVideoDate(video);


        const seoDate =
          videoObjectDates.get(
            id
          );


        const finalDate =
          existingDate ||
          seoDate ||
          null;


        uniqueVideos.push({

          ...video,

          id,

          ...(finalDate
            ? {
                uploadDate:
                  finalDate,
                publishedAt:
                  finalDate
              }
            : {})

        });

      }
    );


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

    addVideoSEO([

      ...normalVideos,

      ...shorts,

      ...liveVideos

    ]);


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
       CONSOLE INFORMATION
    ===================================== */

    console.log(
      "YouTube sync successful"
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
      "VideoObject dates:",
      videoObjectDates.size
    );


    console.log(
      "Video SEO:",
      "Enabled"
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
