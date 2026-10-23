
document.getElementById('year').textContent=new Date().getFullYear();
const motion=matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('.service button').forEach(b=>b.addEventListener('click',()=>{const open=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',!open);b.parentElement.classList.toggle('open',!open)}));
if(!motion && document.querySelector('.visual')){for(let i=0;i<20;i++){const s=document.createElement('i');s.className='spark';s.style.setProperty('--left',(20+Math.random()*60)+'%');s.style.setProperty('--delay',(-Math.random()*8)+'s');s.style.setProperty('--duration',(4+Math.random()*5)+'s');document.querySelector('.visual').append(s)}}
const dialog=document.getElementById('brief');document.querySelectorAll('.brief-open').forEach(b=>b.addEventListener('click',()=>dialog.showModal()));document.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
document.getElementById('briefForm').addEventListener('submit',async e=>{e.preventDefault();const summary='طلب مشروع — جَمْرَة\nالاسم / المشروع: '+document.getElementById('name').value.trim()+'\nالخدمة: '+document.getElementById('service').value+'\nالفكرة: '+document.getElementById('idea').value.trim();try{await navigator.clipboard.writeText(summary);document.getElementById('feedback').textContent='تم النسخ! الملخص جاهز لتشاركه مع الفريق.'}catch{let t=document.getElementById('copyFallback');if(!t){t=document.createElement('textarea');t.id='copyFallback';t.readOnly=true;document.getElementById('feedback').append(t)}t.value=summary;t.focus();t.select();document.getElementById('feedback').prepend('انسخ النص المحدد يدويًا. ')}});
document.getElementById('flameToggle')?.addEventListener('click',function(){const paused=document.querySelector('.visual').classList.toggle('flame-paused');this.setAttribute('aria-pressed',String(!paused));this.textContent=paused?'تشغيل الحركة ▶':'إيقاف الحركة Ⅱ';});

const menuButton=document.querySelector('.mobile-toggle');menuButton.addEventListener('click',()=>{const expanded=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!expanded));document.getElementById('mainLinks').classList.toggle('expanded',!expanded)});
window.addEventListener('pageshow',()=>document.body.classList.remove('page-exit'));
// Use native page navigation; no persistent click lock after Back/Forward.

// Reveal on entry once, without reading and writing layout on every scroll.
(()=>{
 const blocks=[...document.querySelectorAll('.reveal')];
 blocks.forEach(el=>{el.classList.remove('reveal');el.classList.add('visible')});
 if(motion||!('IntersectionObserver' in window))return;
 const headings=[...document.querySelectorAll('main h1:not(.meteor-title),main h2:not([data-contact-words]),.signature')];
 headings.forEach(heading=>{
  const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT),texts=[];
  while(walker.nextNode())texts.push(walker.currentNode);
  let i=0;texts.forEach(node=>{if(!node.textContent.trim())return;const frag=document.createDocumentFragment();
   node.textContent.split(/(\s+)/u).forEach(part=>{if(!part)return;if(/^\s+$/u.test(part)){frag.append(document.createTextNode(part));return}const mask=document.createElement('span');mask.className='word-mask';const word=document.createElement('span');word.className='scroll-word';word.textContent=part;word.style.setProperty('--word-delay',Math.min(i++*55,330)+'ms');mask.append(word);frag.append(mask)});node.replaceWith(frag)});
  heading.classList.add('scroll-heading');
 });
 const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;entry.target.classList.add('scroll-ready');io.unobserve(entry.target)}),{threshold:.08,rootMargin:'0px 0px -4% 0px'});
 blocks.forEach(el=>{el.classList.add('scroll-entry');io.observe(el)});headings.forEach(el=>io.observe(el));
})();
// Stop decorative loops outside the viewport and while the tab is hidden.
(()=>{const visual=document.querySelector('.visual');if(!visual||!('IntersectionObserver' in window))return;let inView=true;const update=()=>visual.classList.toggle('visual-sleep',!inView||document.hidden);new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;update()}).observe(visual);document.addEventListener('visibilitychange',update)})();

document.getElementById('mainLinks').addEventListener('click',e=>{if(!e.target.closest('a'))return;document.getElementById('mainLinks').classList.remove('expanded');document.querySelector('.mobile-toggle').setAttribute('aria-expanded','false')});
