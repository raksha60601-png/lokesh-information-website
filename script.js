const menu=document.querySelector(".menu"), nav=document.querySelector("nav");
menu?.addEventListener("click",()=>{nav.classList.toggle("open")});
document.querySelectorAll("nav a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("show")});
},{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));

document.getElementById("contactForm")?.addEventListener("submit",e=>{
  e.preventDefault();
  document.getElementById("success").style.display="block";
  e.target.reset();
});

const style=document.createElement("style");
style.textContent=`nav.open{display:flex;position:absolute;top:68px;left:0;right:0;padding:18px 6%;background:#05070a;border-bottom:1px solid rgba(120,220,255,.1);flex-direction:column;gap:14px}.nav{transition:.25s}`;
document.head.appendChild(style);
