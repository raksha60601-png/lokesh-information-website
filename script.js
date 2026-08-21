const menu=document.querySelector('.menu');
const nav=document.querySelector('.nav nav');
if(menu&&nav){menu.addEventListener('click',()=>{nav.classList.toggle('open');nav.style.display=nav.classList.contains('open')?'flex':'';nav.style.position='absolute';nav.style.top='70px';nav.style.left='0';nav.style.right='0';nav.style.padding='18px';nav.style.flexDirection='column';nav.style.background='rgba(5,7,10,.98)';nav.style.borderBottom='1px solid rgba(255,255,255,.09)'})}
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('show')}),{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
const form=document.getElementById('contactForm');
const success=document.getElementById('success');
if(form){form.addEventListener('submit',e=>{e.preventDefault();success.style.display='block';form.reset();success.textContent='Thanks! आपकी enquiry तैयार है. Business contact के लिए email जोड़ने के बाद यह form direct enquiry system से connect किया जा सकता है.'})}
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{if(nav&&nav.classList.contains('open')){nav.classList.remove('open');nav.style.display=''}}));
