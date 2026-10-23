// Meteor words strike the wall once, only when the headline enters view.
(()=>{
 const heading=document.querySelector('[data-contact-words]');
 if(!heading||!Element.prototype.animate)return;
 const words=[...heading.querySelectorAll('.contact-word')];
 let played=false,effects=[];
 const replay=document.querySelector('.contact-meteor-replay');
 if(replay)replay.hidden=false;
 function animate(node,frames,timing,remove=false){
  const effect=node.animate(frames,{fill:'both',...timing});effects.push(effect);
  effect.finished.then(()=>{effect.cancel();if(remove)node.remove()}).catch(()=>{if(remove)node.remove()});
 }
 function decor(word,cls){const el=document.createElement('i');el.className=cls;el.setAttribute('aria-hidden','true');word.append(el);return el}
 function impact(word,delay,index){
  const trail=decor(word,'contact-meteor-trail');
  animate(trail,[{opacity:0,transform:'translateY(-220px) scaleY(.3)'},{opacity:.85,offset:.35},{opacity:0,transform:'translateY(0) scaleY(1.15)'}],{delay,duration:720},true);
  const crack=decor(word,'contact-wall-crack');
  crack.innerHTML='<svg viewBox="0 0 180 120" fill="none" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M90 60 66 43 51 22 29 13M66 43 44 45 27 34M90 60 107 37 105 19 119 5M107 37 130 28 150 30M90 60 122 58 141 72 172 75M141 72 150 90M90 60 103 83 98 104 112 118M103 83 127 98M90 60 66 78 48 75 22 94M66 78 61 103 47 116M90 60 54 58 28 66 5 57"/><path d="m83 50 15-4 10 17-14 15-17-8Z" stroke-width="2.5"/></g></svg>';
  animate(crack,[{opacity:0,transform:'translate(-50%,-50%) scale(.15)'},{opacity:.7,transform:'translate(-50%,-50%) scale(1)',offset:.12},{opacity:.45,offset:.65},{opacity:0,transform:'translate(-50%,-50%) scale(1.08)'}],{delay:delay+650,duration:2000},true);
  const dust=decor(word,'contact-impact-dust');
  animate(dust,[{opacity:0,transform:'translate(-50%,-50%) scale(.2)'},{opacity:.4,offset:.1},{opacity:0,transform:'translate(-50%,-50%) scale(2.3)'}],{delay:delay+650,duration:750},true);
  for(let n=0;n<8;n++){
   const shard=decor(word,'contact-wall-shard'),angle=n/8*Math.PI*2+index*.3,dx=Math.cos(angle)*(45+n*6),dy=Math.sin(angle)*55+32;
   animate(shard,[{opacity:0,transform:'translate(0,0) rotate(0) scale(.4)'},{opacity:1,offset:.08},{opacity:0,transform:`translate(${dx}px,${dy}px) rotate(${n*75+90}deg) scale(.6)`}],{delay:delay+650,duration:650+n*25,easing:'cubic-bezier(.16,.6,.4,1)'},true);
  }
 }
 function play(){
  effects.forEach(effect=>effect.cancel());effects=[];
  heading.querySelectorAll('i[aria-hidden]').forEach(node=>node.remove());
  played=true;
  words.forEach((word,index)=>{
   const delay=200+index*560;
   animate(word,[
    {opacity:0,transform:'translateY(-340px) rotate(-14deg) scale(.72)'},
    {opacity:1,offset:.2},
    {opacity:1,transform:'translateY(6px) rotate(2deg) scale(1.12,.88)',offset:.6},
    {transform:'translate(-4px,-6px) rotate(-2deg) scale(.98,1.04)',offset:.69},
    {transform:'translate(3px,2px) rotate(1deg) scale(1)',offset:.78},
    {transform:'translate(-2px,0) rotate(0deg)',offset:.87},
    {opacity:1,transform:'translate(0,0) rotate(0deg) scale(1)'}
   ],{duration:1250,delay,easing:'cubic-bezier(.4,0,.7,1)'});
   impact(word,delay+100,index);
  });
 }
 replay?.addEventListener('click',play);
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
   if(played||!entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.5))return;
   observer.disconnect();play();
  },{threshold:[0,.5],rootMargin:'0px 0px -10% 0px'});
  observer.observe(heading);
 }
})();
