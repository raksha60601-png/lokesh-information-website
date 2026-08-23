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
   YouTube Video Player
   ========================================= */

function videoFrame(id, title = "Lokesh Information video") {
  const safeTitle = String(title)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `
    <div class="video-card">
      <iframe
        src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0"
        title="${safeTitle}"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
      </iframe>
      <div class="video-title">${safeTitle}</div>
    </div>
  `;
}


/* =========================================
   Create YouTube Section
   ========================================= */

function createSection(title, subtitle, videos) {
  if (!videos.length) return "";

  return `
    <section class="youtube-category">
      <div class="youtube-section-title">
        <span>${title}</span>
        <h3>${title}</h3>
        <p>${videos.length} ${subtitle}</p>
      </div>

      <div class="youtube-video-grid">
        ${videos.map((video) => {
          return videoFrame(
            video.id,
            video.title || "Lokesh Information Video"
          );
        }).join("")}
      </div>
    </section>
  `;
}


/* =========================================
   Load YouTube Videos
   ========================================= */

async function loadYouTube() {
  const box = document.getElementById("playlistBox");
  const status = document.getElementById("syncStatus");

  if (!box) {
    console.warn("playlistBox not found.");
    return;
  }

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

    const videos = Array.isArray(data.videos)
      ? data.videos
      : [];

    if (!videos.length) {
      throw new Error("No videos found in videos.json");
    }


    /* =====================================
       Remove duplicates
       ===================================== */

    const uniqueVideos = [];
    const seen = new Set();

    videos.forEach((video) => {
      if (!video || typeof video !== "object") {
        return;
      }

      const id = video.id;

      if (!id || seen.has(id)) {
        return;
      }

      seen.add(id);
      uniqueVideos.push(video);
    });


    /* =====================================
       Separate Videos / Shorts / Live
       ===================================== */

    const normalVideos = uniqueVideos.filter(
      (video) =>
        video.type === "video" ||
        !video.type
    );

    const shorts = uniqueVideos.filter(
      (video) =>
        video.type === "short"
    );

    const liveVideos = uniqueVideos.filter(
      (video) =>
        video.type === "live"
    );


    /* =====================================
       Build Website Sections
       ===================================== */

    let html = "";

    /* Normal Videos */
    html += createSection(
      "🎬 Videos",
      "Videos",
      normalVideos
    );

    /* Shorts */
    html += createSection(
      "📱 Shorts",
      "Shorts",
      shorts
    );

    /* Live */
    html += createSection(
      "🔴 Live",
      "Live videos",
      liveVideos
    );


    /* =====================================
       Display
       ===================================== */

    if (!html) {
      throw new Error(
        "No usable Videos, Shorts or Live videos found."
      );
    }

    box.className = "playlist youtube-sections";
    box.innerHTML = html;


    /* =====================================
       Status
       ===================================== */

    if (status) {
      status.textContent =
        `${normalVideos.length} Videos • ${shorts.length} Shorts • ${liveVideos.length} Live`;
    }


    console.log(
      "YouTube loaded successfully."
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

  } catch (error) {

    console.error(
      "Could not load YouTube videos:",
      error
    );


    /* =====================================
       Playlist Fallback
       ===================================== */

    try {

      const response = await fetch(
        `channel.json?ts=${Date.now()}`,
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          `channel.json returned ${response.status}`
        );
      }

      const data = await response.json();

      if (data.uploadsPlaylistId) {

        box.className = "playlist";

        box.innerHTML = `
          <iframe
            src="https://www.youtube-nocookie.com/embed?listType=playlist&list=${encodeURIComponent(
              data.uploadsPlaylistId
            )}&rel=0"
            title="Lokesh Information YouTube uploads"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen>
          </iframe>
        `;

        if (status) {
          status.textContent =
            "Showing your YouTube uploads playlist";
        }

        return;
      }

    } catch (playlistError) {

      console.warn(
        "Playlist fallback not ready:",
        playlistError
      );

    }


    /* =====================================
       Final Error
       ===================================== */

    box.className = "playlist";

    box.innerHTML = `
      <div class="loading">
        Videos could not be loaded right now.
        Please try again in a moment.
      </div>
    `;

    if (status) {
      status.textContent =
        "YouTube sync is waiting for an update.";
    }
  }
}


/* =========================================
   First Load
   ========================================= */

loadYouTube();


/* =========================================
   Auto Refresh Every 5 Minutes
   ========================================= */

setInterval(
  loadYouTube,
  5 * 60 * 1000
);
