const header = document.querySelector("header");
const menu = document.querySelector(".menu");

menu?.addEventListener("click", () => header.classList.toggle("nav-open"));
document.querySelectorAll("nav a").forEach(a =>
  a.addEventListener("click", () => header.classList.remove("nav-open"))
);

function videoFrame(id, title = "Lokesh Information video") {
  const safeTitle = String(title).replace(/"/g, "&quot;");
  return `
    <div class="video-card">
      <iframe
        src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0"
        title="${safeTitle}"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
      </iframe>
    </div>`;
}

async function loadYouTube() {
  const box = document.getElementById("playlistBox");
  const status = document.getElementById("syncStatus");

  if (!box) return;

  try {
    const response = await fetch(`videos.json?ts=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) throw new Error(`videos.json returned ${response.status}`);

    const data = await response.json();
    const videos = Array.isArray(data.videos) ? data.videos : [];

    if (videos.length) {
      box.className = "playlist video-grid";
      box.innerHTML = videos.map((video, index) => {
        const id = typeof video === "string" ? video : video.id;
        const title = typeof video === "object" && video.title
          ? video.title
          : `Lokesh Information — Video ${index + 1}`;
        return id ? videoFrame(id, title) : "";
      }).join("");

      status.textContent = `${videos.length} videos from your YouTube channel`;
      return;
    }
  } catch (error) {
    console.warn("Could not load videos.json:", error);
  }

  // Last-resort fallback: use the channel uploads playlist if channel.json has it.
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
        </iframe>`;
      status.textContent = "Showing your YouTube uploads playlist";
      return;
    }
  } catch (error) {
    console.warn("Playlist fallback not ready:", error);
  }

  box.className = "playlist";
  box.innerHTML = '<div class="loading">Videos will appear after the first YouTube sync.</div>';
  status.textContent = "YouTube sync is waiting for the first update.";
}

loadYouTube();

// Refresh the feed when the page stays open.
setInterval(loadYouTube, 5 * 60 * 1000);
