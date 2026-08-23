const header = document.querySelector("header");
const menu = document.querySelector(".menu");

menu?.addEventListener("click", () => header.classList.toggle("nav-open"));

document.querySelectorAll("nav a").forEach(a =>
  a.addEventListener("click", () => header.classList.remove("nav-open"))
);


// ------------------------------------
// YouTube Video Player
// ------------------------------------

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
    </div>
  `;
}


// ------------------------------------
// Load YouTube Videos + Shorts
// ------------------------------------

async function loadYouTube() {
  const box = document.getElementById("playlistBox");
  const status = document.getElementById("syncStatus");

  if (!box) return;

  try {
    const response = await fetch(`videos.json?ts=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`videos.json returned ${response.status}`);
    }

    const data = await response.json();
    const items = Array.isArray(data.videos) ? data.videos : [];

    if (items.length) {

      // -----------------------------
      // Separate Videos and Shorts
      // -----------------------------

      const normalVideos = items.filter(video => {
        return typeof video === "object" &&
               video.type !== "short";
      });

      const shorts = items.filter(video => {
        return typeof video === "object" &&
               video.type === "short";
      });


      // -----------------------------
      // Normal Videos HTML
      // -----------------------------

      let videosHTML = "";

      if (normalVideos.length) {
        videosHTML = `
          <div class="youtube-section">
            <div class="heading">
              <span>VIDEOS</span>
              <h2>Latest Videos</h2>
              <p>Lokesh Information की नई और पुरानी YouTube videos.</p>
            </div>

            <div class="video-grid">
              ${normalVideos.map((video, index) => {
                const id = video.id;

                const title = video.title ||
                  `Lokesh Information — Video ${index + 1}`;

                return id ? videoFrame(id, title) : "";
              }).join("")}
            </div>
          </div>
        `;
      }


      // -----------------------------
      // Shorts HTML
      // -----------------------------

      let shortsHTML = "";

      if (shorts.length) {
        shortsHTML = `
          <div class="youtube-section">
            <div class="heading">
              <span>YOUTUBE SHORTS</span>
              <h2>Latest Shorts</h2>
              <p>Lokesh Information के YouTube Shorts.</p>
            </div>

            <div class="video-grid">
              ${shorts.map((video, index) => {
                const id = video.id;

                const title = video.title ||
                  `Lokesh Information — Short ${index + 1}`;

                return id ? videoFrame(id, title) : "";
              }).join("")}
            </div>
          </div>
        `;
      }


      // -----------------------------
      // Show Everything
      // -----------------------------

      box.className = "playlist";

      box.innerHTML = `
        ${videosHTML}
        ${shortsHTML}
      `;


      // -----------------------------
      // Status
      // -----------------------------

      status.textContent =
        `${normalVideos.length} videos • ${shorts.length} shorts`;

      return;
    }

  } catch (error) {
    console.warn("Could not load videos.json:", error);
  }


  // ------------------------------------
  // Last-resort YouTube Playlist
  // ------------------------------------

  try {
    const response = await fetch(`channel.json?ts=${Date.now()}`, {
      cache: "no-store"
    });

    const data = await response.json();

    if (data.uploadsPlaylistId) {

      box.className = "playlist";

      box.innerHTML = `
        <iframe
          src="https://www.youtube-nocookie.com/embed?listType=playlist&list=${encodeURIComponent(data.uploadsPlaylistId)}&rel=0"
          title="Lokesh Information YouTube uploads"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      `;

      status.textContent =
        "Showing your YouTube uploads playlist";

      return;
    }

  } catch (error) {
    console.warn("Playlist fallback not ready:", error);
  }


  // ------------------------------------
  // Nothing Found
  // ------------------------------------

  box.className = "playlist";

  box.innerHTML = `
    <div class="loading">
      Videos will appear after the first YouTube sync.
    </div>
  `;

  status.textContent =
    "YouTube sync is waiting for the first update.";
}


// ------------------------------------
// Start
// ------------------------------------

loadYouTube();


// Refresh every 5 minutes
setInterval(loadYouTube, 5 * 60 * 1000);
