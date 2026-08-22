const header=document.querySelector("header");
const menu=document.querySelector(".menu");
menu?.addEventListener("click",()=>header.classList.toggle("nav-open"));
document.querySelectorAll("nav a").forEach(a=>a.addEventListener("click",()=>header.classList.remove("nav-open")));

async function loadYouTube(){
  const box=document.getElementById("playlistBox");
  const status=document.getElementById("syncStatus");
  try{
    const r=await fetch("channel.json?ts="+Date.now(),{cache:"no-store"});
    const data=await r.json();
    if(data.channelId && data.uploadsPlaylistId){
      box.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed?listType=playlist&list=${encodeURIComponent(data.uploadsPlaylistId)}&rel=0" title="Lokesh Information YouTube uploads" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
      status.textContent="Auto-updated from your YouTube uploads playlist";
      return;
    }
  }catch(e){ console.warn("YouTube feed not ready:",e); }

  status.textContent="YouTube sync is being prepared — showing your current videos.";
  try{
    const f=await fetch("videos.json?ts="+Date.now(),{cache:"no-store"});
    const d=await f.json();
    const videos=Array.isArray(d.videos)?d.videos:[];
    if(!videos.length){box.innerHTML='<div class="loading">Videos will appear after the first YouTube sync.</div>';return;}
    box.innerHTML=`<div class="fallback-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:14px">${videos.map(v=>`<iframe style="width:100%;aspect-ratio:16/9;border:0;border-radius:12px" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?rel=0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`).join("")}</div>`;
  }catch(e){
    box.innerHTML='<div class="loading">Videos will appear after the first YouTube sync.</div>';
  }
}
loadYouTube();
