const header=document.querySelector("header");
const menuButton=document.createElement("button");
menuButton.className="menu-btn";menuButton.setAttribute("aria-label","Open menu");menuButton.innerHTML="☰";
header.insertBefore(menuButton,header.querySelector("nav"));
menuButton.addEventListener("click",()=>header.classList.toggle("nav-open"));
document.querySelectorAll("nav a").forEach(a=>a.addEventListener("click",()=>header.classList.remove("nav-open")));
window.addEventListener("scroll",()=>header.classList.toggle("scrolled",window.scrollY>10));
document.querySelectorAll("a[href^='#']").forEach(a=>a.addEventListener("click",e=>{const t=document.querySelector(a.getAttribute("href"));if(t){e.preventDefault();t.scrollIntoView({behavior:"smooth"})}}));
const style=document.createElement("style");style.textContent=".menu-btn{display:none;background:none;border:1px solid rgba(92,220,255,.2);color:#fff;border-radius:9px;padding:7px 10px;font-size:20px;margin-left:auto}.scrolled{box-shadow:0 10px 35px rgba(0,0,0,.25)}@media(max-width:950px){.menu-btn{display:block}.nav-open .menu-btn{color:#36e6ff}}";document.head.appendChild(style);
