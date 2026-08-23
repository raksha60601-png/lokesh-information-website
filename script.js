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
    </div>
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
       Remove duplicate videos
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
       Separate normal videos and Shorts
       ===================================== */

    const normalVideos = uniqueVideos.filter(
      (video) => video.type !== "short"
    );

    const shorts = uniqueVideos.filter(
      (video) => video.type === "short"
    );


    /* =====================================
       Show videos
       ===================================== */

    box.className = "playlist video-grid";

    let html = "";


    /* Normal Videos */

    if (normalVideos.length) {

      html += `
        <div class="youtube-section-title">
          <h3>Videos</h3>
          <p>${normalVideos.length} videos</p>
        </div>
      `;

      html += normalVideos
        .map((video) => {

          const id = video.id;

          const title =
            video.title ||
            "Lokesh Information Video";

          return videoFrame(
            id,
            title
          );

        })
        .join("");
    }


    /* Shorts */

    if (shorts.length) {

      html += `
        <div class="youtube-section-title">
          <h3>Shorts</h3>
          <p>${shorts.length} Shorts</p>
        </div>
      `;

      html += shorts
        .map((video) => {

          const id = video.id;

          const title =
            video.title ||
            "Lokesh Information Short";

          return videoFrame(
            id,
            title
          );

        })
        .join("");
    }


    box.innerHTML = html;


    /* =====================================
       Status
       ===================================== */

    if (status) {

      status.textContent =
        `${uniqueVideos.length} videos from your YouTube channel`;

    }

    console.log(
      `YouTube loaded: ${uniqueVideos.length} videos`
    );

    console.log(
      `Normal videos: ${normalVideos.length}`
    );

    console.log(
      `Shorts: ${shorts.length}`
    );

  } catch (error) {

    console.error(
      "Could not load YouTube videos:",
      error
    );


    /* =====================================
       Playlist fallback
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
       Final fallback message
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
   First load
   ========================================= */

loadYouTube();


/* =========================================
   Auto refresh every 5 minutes
   ========================================= */

setInterval(
  loadYouTube,
  5 * 60 * 1000
);
