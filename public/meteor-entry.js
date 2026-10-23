(()=>{
 'use strict';
 const title=document.querySelector('.meteor-title');if(!title)return;
 const words=[...title.querySelectorAll('.meteor-word')],button=document.querySelector('.meteor-replay');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let effects=[],decoration=[],started=false,pending=0;
 function clear(){effects.forEach(effect=>effect.cancel());effects=[];decoration.forEach(node=>node.remove());decoration=[];clearTimeout(pending)}
 function play(explicit=false){
  clear();started=true;
  const gentle=reduced&&!explicit;
  words.forEach((word,index)=>{
   const delay=120+index*410;
   if(!word.animate){word.style.opacity='1';return}
   const frames=gentle?[{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'none'}]:[
    {offset:0,opacity:0,transform:'translate(65px,-650px) rotate(-12deg) scale(.82)'},
    {offset:.12,opacity:1},
    {offset:.68,opacity:1,transform:'translate(0,10px) rotate(2deg) scale(1.04,.94)',textShadow:'0 0 25px #ffac60'},
    {offset:.84,transform:'translate(0,-5px) rotate(-1deg)'},
    {offset:1,opacity:1,transform:'none',textShadow:'none'}
   ];
   effects.push(word.animate(frames,{duration:gentle?700:1250,delay,fill:'both',easing:'cubic-bezier(.32,.1,.4,1)'}));
   if(index===words.length-1){
    const emberDim={color:'#ff402e',textShadow:'0 0 7px #ff382b99,0 0 20px #ee231c66,0 0 38px #c9181433'};
    const emberBright={color:'#ff5542',textShadow:'0 0 10px #ff4b36cc,0 0 28px #ff2b22aa,0 0 48px #d51d1755'};
    const fireGlow=gentle?[emberDim,emberBright,emberDim]:[
     {color:'#ffb19a',textShadow:'0 -2px 4px #ffccb0,0 -8px 13px #ff6038,0 -18px 25px #ed241b'},
     {offset:.2,color:'#ff8263',textShadow:'0 -3px 6px #ff9c71,0 -12px 18px #ff4328,0 -26px 32px #cf1614'},
     {offset:.5,...emberBright},emberDim
    ];
    const ignitionDuration=gentle?1100:2100;
    effects.push(word.animate(fireGlow,{duration:ignitionDuration,delay:delay+820,fill:'forwards'}));
    // Persistent red ember glow after ignition; replay clears the previous loop.
    effects.push(word.animate(gentle?[emberDim,emberDim]:[emberDim,emberBright,emberDim],{duration:2600,delay:delay+820+ignitionDuration,iterations:Infinity,fill:'forwards',easing:'ease-in-out'}));
    if(!gentle)for(let flame=0;flame<14;flame++){
     const tongue=document.createElement('i');tongue.className='meteor-fire-tongue';tongue.setAttribute('aria-hidden','true');tongue.style.left=(4+flame*7)+'%';tongue.style.height=(.38+(flame%4)*.15)+'em';word.append(tongue);decoration.push(tongue);
     effects.push(tongue.animate([
      {opacity:0,transform:'translateY(0) scale(.5,.25) rotate(-9deg)'},
      {offset:.25,opacity:.9,transform:'translateY(-7px) scale(1,1.05) rotate(7deg)'},
      {offset:.57,opacity:.7,transform:'translateY(-15px) scale(.75,1.25) rotate(-7deg)'},
      {opacity:0,transform:'translateY(-28px) scale(.2,.35) rotate(9deg)'}
     ],{duration:620+(flame%3)*70,iterations:3,delay:delay+780+(flame%4)*65,fill:'both',easing:'ease-out'}));
    }
   }
   if(gentle)return;
   const trail=document.createElement('i');trail.className='meteor-live-trail';trail.setAttribute('aria-hidden','true');word.append(trail);decoration.push(trail);
   effects.push(trail.animate([{opacity:0,transform:'rotate(12deg) scaleY(1.2)'},{offset:.2,opacity:.95},{offset:.6,opacity:.75},{opacity:0,transform:'rotate(12deg) scaleY(0)'}],{duration:1250,delay,fill:'both'}));
   for(let spark=0;spark<6;spark++){
    const dot=document.createElement('i');dot.className='meteor-live-spark';dot.setAttribute('aria-hidden','true');word.append(dot);decoration.push(dot);
    const angle=spark*Math.PI/3,dx=Math.cos(angle)*55,dy=Math.sin(angle)*35;
    effects.push(dot.animate([{opacity:0,transform:'translate(0,0) scale(.3)'},{offset:.15,opacity:1},{opacity:0,transform:`translate(${dx}px,${dy}px) scale(.2)`}],{duration:600,delay:delay+820,fill:'both'}));
   }
  });
  pending=setTimeout(()=>{decoration.forEach(node=>node.remove());decoration=[]},5400);
 }
 button?.addEventListener('click',()=>play(true));
 async function begin(){
  if(document.fonts?.ready)await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1200))]);
  if(document.hidden){document.addEventListener('visibilitychange',function visible(){if(document.hidden)return;document.removeEventListener('visibilitychange',visible);play()});return}
  requestAnimationFrame(()=>requestAnimationFrame(()=>play()));
 }
 window.addEventListener('pageshow',event=>{if(event.persisted&&started)play()});
 begin();
})();
