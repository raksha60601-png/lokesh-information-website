/* =========================================
   LOKESH INFORMATION
   YouTube Videos / Shorts / Live
   Dynamic Video SEO + Auto Refresh
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
   VIDEO SEO
========================================= */

function addVideoSEO(videos) {

  /* Remove old dynamic VideoObject data */
  document
    .querySelectorAll('script[data-video-seo="true"]')
    .forEach((element) => element.remove());


  if (!Array.isArray(videos) || !videos.length) {
    return;
  }


  /* Google SEO data for latest 20 videos */
  const validVideos = videos
    .filter(video => video && video.id)
    .slice(0, 20);


  const seen = new Set();


  validVideos.forEach((video) => {

    const id =
      String(video.id).trim();


    /* Avoid duplicate VideoObject */
    if (!id || seen.has(id)) {
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


    /*
      Different JSON files may use:
      publishedAt
      uploadDate
      published
    */
    const uploadDate =
      video.publishedAt ||
      video.uploadDate ||
      video.published ||
      null;


    const videoUrl =
      `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;


    const embedUrl =
      `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;


    const schema = {

      "@context": "https://schema.org",

      "@type": "VideoObject",

      "name": title,

      "description": description,

      "thumbnailUrl": [
        thumbnail
      ],

      "embedUrl": embedUrl,

      "publisher": {
        "@type": "Organization",
        "name": "Lokesh Information",
        "logo": {
          "@type": "ImageObject",
          "url": "https://raksha60601-png.github.io/lokesh-information-website/assets/lokesh-information-dp.png"
        }
      },

      "author": {
        "@type": "Person",
        "name": "Lokesh Information"
      },

      "url": videoUrl

    };


    /*
      IMPORTANT:
      contentUrl normally means the actual video-file URL.
      Since YouTube does not expose your MP4 file URL,
      we don't pretend the YouTube watch URL is the video file.
    */


    /* Add uploadDate only when real date exists */
    if (uploadDate) {

      const dateString =
        String(uploadDate).trim();


      if (
        /^\d{4}-\d{2}-\d{2}/.test(dateString)
      ) {

        schema.uploadDate =
          dateString;

      }

    }


    /* Optional duration */
    if (video.duration) {

      schema.duration =
        String(video.duration).trim();

    }


    const script =
      document.createElement("script");


    script.type =
      "application/ld+json";


    script.dataset.videoSeo =
      "true";


    script.textContent =
      JSON.stringify(schema);


    document.head.appendChild(script);

  });

}


/* =========================================
   CREATE VIDEO CARD
========================================= */

function videoCard(video) {

  const id =
    String(video.id || "").trim();


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
    video.publishedAt ||
    video.uploadDate ||
    video.published ||
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

    const seen =
      new Set();


    allVideos.forEach((video) => {

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
      "Video SEO:",
      "Enabled"
    );


  } catch (error) {

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
      fullView.hidden = true;
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
      .getElementById("videos")
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
