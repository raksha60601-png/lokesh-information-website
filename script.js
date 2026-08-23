/* =========================================
   HEADER / MOBILE MENU
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
   YOUTUBE VIDEO CARD
========================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


function videoFrame(video) {
  const id = video.id;
  const title = escapeHTML(
    video.title || "Lokesh Information Video"
  );

  return `
    <div class="video-card">

      <iframe
        src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0"
        title="${title}"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
      </iframe>

      <div class="video-title">
        ${title}
      </div>

    </div>
  `;
}


/* =========================================
   SHOW VIDEOS IN GRID
========================================= */

function renderGrid(element, videos, emptyText) {

  if (!element) return;

  if (!videos.length) {

    element.innerHTML = `
      <div class="loading">
        ${emptyText}
      </div>
    `;

    return;
  }

  element.innerHTML = videos
    .map(video => videoFrame(video))
    .join("");
}


/* =========================================
   UPDATE COUNTS
========================================= */

function updateCounts(videos, shorts, live) {

  const videoCount = document.getElementById("videoCount");
  const shortCount = document.getElementById("shortCount");
  const liveCount = document.getElementById("liveCount");

  if (videoCount) {
    videoCount.textContent =
      `${videos.length} Videos`;
  }

  if (shortCount) {
    shortCount.textContent =
      `${shorts.length} Shorts`;
  }

  if (liveCount) {
    liveCount.textContent =
      `${live.length} Live Streams`;
  }
}


/* =========================================
   LOAD YOUTUBE DATA
========================================= */

async function loadYouTube() {

  const videosGrid =
    document.getElementById("videosGrid");

  const shortsGrid =
    document.getElementById("shortsGrid");

  const liveGrid =
    document.getElementById("liveGrid");


  try {

    const response = await fetch(
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


    const data = await response.json();


    const allVideos =
      Array.isArray(data.videos)
        ? data.videos
        : [];


    /* =====================================
       REMOVE DUPLICATES
    ===================================== */

    const uniqueVideos = [];

    const seen = new Set();


    allVideos.forEach(video => {

      if (
        !video ||
        typeof video !== "object" ||
        !video.id
      ) {
        return;
      }


      if (seen.has(video.id)) {
        return;
      }


      seen.add(video.id);

      uniqueVideos.push(video);

    });


    /* =====================================
       SEPARATE VIDEO TYPES
    ===================================== */

    const normalVideos =
      uniqueVideos.filter(video => {

        return (
          video.type === "video" ||
          !video.type
        );

      });


    const shorts =
      uniqueVideos.filter(video => {

        return video.type === "short";

      });


    const liveVideos =
      uniqueVideos.filter(video => {

        return video.type === "live";

      });


    /* =====================================
       DISPLAY EACH SECTION SEPARATELY
    ===================================== */

    renderGrid(
      videosGrid,
      normalVideos,
      "No videos available right now."
    );


    renderGrid(
      shortsGrid,
      shorts,
      "No Shorts available right now."
    );


    renderGrid(
      liveGrid,
      liveVideos,
      "No Live streams available right now."
    );


    /* =====================================
       UPDATE COUNTS
    ===================================== */

    updateCounts(
      normalVideos,
      shorts,
      liveVideos
    );


    console.log(
      "YouTube sync successful."
    );


    console.log(
      `Videos: ${normalVideos.length}`
    );


    console.log(
      `Shorts: ${shorts.length}`
    );


    console.log(
      `Live: ${liveVideos.length}`
    );


    /* =====================================
       SAVE DATA FOR VIEW ALL
    ===================================== */

    window.youtubeData = {

      videos: normalVideos,

      shorts: shorts,

      live: liveVideos

    };


  } catch (error) {

    console.error(
      "Could not load YouTube videos:",
      error
    );


    if (videosGrid) {

      videosGrid.innerHTML = `
        <div class="loading">
          Videos could not be loaded right now.
        </div>
      `;

    }


    if (shortsGrid) {

      shortsGrid.innerHTML = `
        <div class="loading">
          Shorts could not be loaded right now.
        </div>
      `;

    }


    if (liveGrid) {

      liveGrid.innerHTML = `
        <div class="loading">
          Live streams could not be loaded right now.
        </div>
      `;

    }

  }

}


/* =========================================
   VIEW ALL SYSTEM
========================================= */

function openFullView(type) {

  const fullView =
    document.getElementById("youtubeFullView");

  const fullGrid =
    document.getElementById("fullViewGrid");

  const fullLabel =
    document.getElementById("fullViewLabel");

  const fullTitle =
    document.getElementById("fullViewTitle");


  if (
    !fullView ||
    !fullGrid
  ) {
    return;
  }


  const data =
    window.youtubeData || {
      videos: [],
      shorts: [],
      live: []
    };


  let items = [];

  let label = "";

  let title = "";


  if (type === "videos") {

    items = data.videos;

    label = "▶ VIDEOS";

    title = "All Videos";

  }


  if (type === "shorts") {

    items = data.shorts;

    label = "🟢 YOUTUBE SHORTS";

    title = "All Shorts";

  }


  if (type === "live") {

    items = data.live;

    label = "🔴 LIVE STREAMS";

    title = "All Live Streams";

  }


  if (fullLabel) {
    fullLabel.textContent = label;
  }


  if (fullTitle) {
    fullTitle.textContent = title;
  }


  if (!items.length) {

    fullGrid.innerHTML = `
      <div class="loading">
        No content available right now.
      </div>
    `;

  } else {

    fullGrid.innerHTML =
      items
        .map(video => videoFrame(video))
        .join("");

  }


  fullView.hidden = false;


  /* Hide normal sections */

  document
    .querySelectorAll(".youtube-category")
    .forEach(section => {

      section.style.display = "none";

    });


  /* Scroll to full view */

  fullView.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


/* =========================================
   BACK FROM VIEW ALL
========================================= */

function closeFullView() {

  const fullView =
    document.getElementById("youtubeFullView");


  if (!fullView) {
    return;
  }


  fullView.hidden = true;


  document
    .querySelectorAll(".youtube-category")
    .forEach(section => {

      section.style.display = "";

    });


  document
    .getElementById("videos")
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

}


/* =========================================
   VIEW ALL BUTTONS
========================================= */

document
  .querySelectorAll(".view-all-btn")
  .forEach(button => {

    button.addEventListener("click", () => {

      const section =
        button.dataset.section;

      openFullView(section);

    });

  });


/* =========================================
   BACK BUTTON
========================================= */

document
  .getElementById("backToYoutubeSections")
  ?.addEventListener(
    "click",
    closeFullView
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
