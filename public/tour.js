(()=>{
 'use strict';
 const steps=window.JAMRA_TOUR_STEPS;if(!steps?.length)return;
 const KEY='jamra.guide.v5';const ACTIVE=KEY+'.active';const DONE=KEY+'.done';
 const read=(store,key)=>{try{return window[store].getItem(key)}catch{return null}};
 const write=(store,key,value)=>{try{if(value===null)window[store].removeItem(key);else window[store].setItem(key,value)}catch{}};
 const pageNames={'page-services':'services.html','page-team':'team.html','page-taqat':'taqat.html'};
 const pageClass=Object.keys(pageNames).find(name=>document.body.classList.contains(name));
 const slug=location.pathname.replace(/\/+$/,'').split('/').pop()||'index';
 const page=pageClass?pageNames[pageClass]:(slug.endsWith('.html')?slug:slug+'.html');
 const localSteps=steps.map((step,index)=>step.page===page?index:-1).filter(index=>index>=0);
 let localTour=false;
 const servicesEnd=steps.reduce((last,step,index)=>step.page==='services.html'?index:last,-1);
 const teamStart=steps.findIndex(step=>step.page==='team.html');
 const servicesStart=steps.findIndex(step=>step.page==='services.html');
 const params=new URLSearchParams(location.search);const named=params.get('guide');const fromURL=params.get('guideStep')??(named?String(steps.findIndex(step=>step.page===page)):null);
 let raw=fromURL!==null?fromURL:read('sessionStorage',ACTIVE);
 let current=raw!==null&&/^\d+$/.test(raw)&&Number(raw)<steps.length?Number(raw):null;
 // Only an explicit Next/Previous request may move between pages.
 // A visitor opening a different page from the menu always keeps that page.
 if(current!==null && steps[current].page!==page && fromURL===null){current=null;write('sessionStorage',ACTIVE,null);write('sessionStorage',DONE,'1')}
 if(current!==null&&fromURL!==null&&steps[current].page!==page){const localStep=steps.findIndex(step=>step.page===page);current=localStep<0?null:localStep}
 if(fromURL!==null){params.delete('guideStep');params.delete('guide');try{history.replaceState(null,'',location.pathname+(params.size?'?'+params:'')+location.hash)}catch{}}
 const launcher=document.createElement('button');launcher.className='guide-launch';launcher.type='button';launcher.innerHTML='<span aria-hidden="true">🔥</span> دليلك';launcher.setAttribute('aria-label','ابدأ الجولة التعريفية مع إبراهيم');
 const focus=document.createElement('div');focus.className='guide-focus';focus.hidden=true;focus.setAttribute('aria-hidden','true');
 const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');arrow.classList.add('guide-arrow');arrow.setAttribute('aria-hidden','true');arrow.setAttribute('hidden','');arrow.innerHTML='<path></path><circle r="4"></circle>';
 const guide=document.createElement('aside');guide.className='jamra-guide';guide.hidden=true;guide.setAttribute('aria-label','جولة الموقع مع إبراهيم');guide.innerHTML='<div class="guide-bubble"><div class="guide-meta"><span>إبراهيم • دليلك بجَمْرَة</span><button class="guide-skip" type="button" aria-label="إنهاء الجولة">تخطّي ×</button></div><div aria-live="polite" aria-atomic="true"><h2 class="guide-title"></h2><p class="guide-text"></p></div><div class="guide-actions"><button class="guide-next" type="button">التالي ←</button><button class="guide-back" type="button">السابق</button><span class="guide-counter"></span></div></div><img class="guide-person" src="assets/guide/welcome.webp" alt="إبراهيم يرحب بك" width="480" height="720"></aside>';
 document.body.append(launcher,focus,arrow,guide);
 const next=guide.querySelector('.guide-next'),back=guide.querySelector('.guide-back'),sprite=guide.querySelector('.guide-person');
 let target=null,active=false,busy=false,frame=0,spriteTimer,scrollTimer;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 // Load the remaining poses after the first so the initial page stays light.
 for(const pose of ['welcome','explain','finish']){const img=new Image();img.src='assets/guide/'+pose+'.webp'}
 function close(returnFocus=true){active=false;current=null;guide.hidden=true;focus.hidden=true;arrow.setAttribute('hidden','');launcher.hidden=false;write('sessionStorage',ACTIVE,null);write('sessionStorage',DONE,'1');write('localStorage',DONE,'1');clearTimeout(scrollTimer);clearTimeout(spriteTimer);busy=false;if(returnFocus)launcher.focus({preventScroll:true})}
 function position(){frame=0;if(!active||!target||!target.isConnected||document.body.classList.contains('member-view-open'))return;
  const r=target.getBoundingClientRect(),pad=7;
  if(innerWidth>800){const center=r.left+r.width/2;guide.classList.toggle('at-right',center<innerWidth*.38)}
  const top=Math.max(8,r.top-pad),bottom=Math.min(innerHeight-8,r.bottom+pad);
  focus.hidden=r.bottom<0||r.top>innerHeight||bottom<=top;
  if(!focus.hidden){Object.assign(focus.style,{top:top+'px',left:Math.max(5,r.left-pad)+'px',width:Math.min(r.width+pad*2,innerWidth-10)+'px',height:Math.max(0,bottom-top)+'px'})}
  const arrowHidden=focus.hidden||innerWidth<=800;arrow.toggleAttribute('hidden',arrowHidden);
  if(!arrowHidden){const b=guide.querySelector('.guide-bubble').getBoundingClientRect();const right=guide.classList.contains('at-right');const sx=right?b.left:b.right,sy=b.top+b.height*.5;const ex=Math.min(innerWidth-15,Math.max(15,right?r.right+10:r.left-10)),ey=Math.min(innerHeight-20,Math.max(30,r.top+Math.min(65,r.height/2)));arrow.setAttribute('viewBox','0 0 '+innerWidth+' '+innerHeight);arrow.querySelector('path').setAttribute('d',`M ${sx} ${sy} C ${sx+(right?-65:65)} ${sy}, ${ex+(right?65:-65)} ${ey}, ${ex} ${ey}`);const c=arrow.querySelector('circle');c.setAttribute('cx',ex);c.setAttribute('cy',ey)}
 }
 function schedule(){if(!frame&&active)frame=requestAnimationFrame(position)}
 function show(index,restore=false){
  if(!Number.isInteger(index)||index<0||index>=steps.length)return;
  const step=steps[index];current=index;write('sessionStorage',ACTIVE,String(index));
  if(page!==step.page){busy=true;const url=new URL(step.page,location.href);url.searchParams.set('guideStep',String(index));location.assign(url.href);return}
  active=true;guide.hidden=false;launcher.hidden=true;target=document.querySelector(step.target);
  guide.classList.toggle('contact-scene-guide',!!step.scene);
  guide.querySelector('.guide-title').textContent=step.title;guide.querySelector('.guide-text').textContent=step.text;
  guide.querySelector('.guide-counter').textContent=(index+1)+' / '+steps.length;
  const localEnd=localTour&&index===localSteps[localSteps.length-1];
  next.textContent=step.scene&&servicesStart>=0?'نروح لخدماتنا ←':index===servicesEnd&&teamStart>=0?'تعرّف على الفريق ←':index===steps.length-1||localEnd?'تمام، خلصنا ✓':'التالي ←';back.disabled=index===0||(localTour&&index===localSteps[0]);
  const imagePath=step.image||'assets/guide/'+step.pose+'.webp';sprite.classList.add('changing');clearTimeout(spriteTimer);
  spriteTimer=setTimeout(()=>{sprite.src=imagePath;sprite.alt=step.image?'إبراهيم واقف خلف الكنبة ويده على كتف طارق':{welcome:'إبراهيم يرحب بك بابتسامة',explain:'إبراهيم يشرح ويشير للأعلى',finish:'إبراهيم مبتسم ويرفع إبهامه'}[step.pose];sprite.classList.remove('changing')},reduce?0:120);
  busy=false;clearTimeout(scrollTimer);
  if(target){const top=target.getBoundingClientRect().top+scrollY-(innerWidth<=800?90:120);window.scrollTo({top:Math.max(0,top),behavior:reduce?'instant':'smooth'})}else{focus.hidden=true;arrow.setAttribute('hidden','')}
  schedule();scrollTimer=setTimeout(()=>{busy=false;position();if(!restore)next.focus({preventScroll:true})},reduce?50:650);
 }
 next.addEventListener('click',()=>{if(busy)return;if(steps[current]?.scene&&servicesStart>=0){localTour=false;show(servicesStart);return}if(current===servicesEnd&&teamStart>=0){localTour=false;show(teamStart);return}if(current===steps.length-1||(localTour&&current===localSteps[localSteps.length-1]))close();else show(localTour?localSteps[localSteps.indexOf(current)+1]:current+1)});
 back.addEventListener('click',()=>{if(!busy&&current===teamStart&&servicesEnd>=0&&!localTour){show(servicesEnd);return}if(!busy&&current>0&&!(localTour&&current===localSteps[0]))show(localTour?localSteps[localSteps.indexOf(current)-1]:current-1)});
 guide.querySelector('.guide-skip').addEventListener('click',close);
 launcher.addEventListener('click',e=>{e.preventDefault?.();e.stopPropagation?.();if(!localSteps.length)return;write('sessionStorage',DONE,null);localTour=true;show(localSteps[0])});
 document.addEventListener('keydown',e=>{if(!active||e.target.matches('input,textarea,select'))return;if(e.key==='Escape'){e.preventDefault();close()}else if(e.key==='Enter'&&e.target===next){/* native button activation */}});
 document.addEventListener('click',e=>{if(!active||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const a=e.target.closest?.('a[href]');if(!a||a.target||a.hasAttribute('download'))return;const u=new URL(a.href,location.href);if(u.origin===location.origin&&u.pathname!==location.pathname)close(false)},{capture:true});
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
 window.addEventListener('pageshow',()=>{busy=false;if(active&&read('sessionStorage',ACTIVE)===null)close(false);else if(active)schedule()});
 sprite.addEventListener('error',()=>{sprite.src='assets/ibrahim-khalaf.webp';sprite.alt='إبراهيم خلف — دليلك في جَمْرَة'},{once:true});
 if(current!==null)setTimeout(()=>show(current,true),180);
 else if(!read('localStorage',DONE)&&!read('sessionStorage',DONE)){
  const first=steps.findIndex(step=>step.page===page);
  if(first<0)return;
  setTimeout(()=>{if(!document.querySelector('dialog[open]'))show(first,true)},page==='index.html'&&!reduce?4500:850);
 }
})();
