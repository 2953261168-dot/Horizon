(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const native=CSS.supports('(animation-timeline: view()) and (animation-range: entry)');
  const chapter=document.querySelector('.gaze-chapter');
  const basin=document.querySelector('.catchment');
  const lakeButton=document.querySelector('.lake-stir');
  const ns='http://www.w3.org/2000/svg';
  const clamp=n=>Math.max(0,Math.min(1,n));
  function ripple(event){
    if(!lakeButton||reduced.matches)return;
    const svg=lakeButton.querySelector('svg'),rect=svg.getBoundingClientRect();
    const x=event?.detail ? clamp((event.clientX-rect.left)/rect.width)*1600 : 800;
    const y=event?.detail ? Math.max(80,Math.min(180,(event.clientY-rect.top)/rect.height*240)) : 125;
    lakeButton.querySelectorAll('.lake-ripples ellipse').forEach((line,i)=>{
      line.setAttribute('cx',String(x));line.setAttribute('cy',String(y));
      line.getAnimations().forEach(a=>a.cancel());
      line.animate([{transform:'scale(.15)',opacity:0},{transform:'scale(.7)',opacity:.8,offset:.18},{transform:'scale(2.2)',opacity:0}],{duration:2600+i*180,delay:i*130,easing:'cubic-bezier(.2,.5,.4,1)'});
    });
  }
  lakeButton?.addEventListener('click',ripple);
  if(!chapter||!basin)return;
  const svg=document.createElementNS(ns,'svg');svg.classList.add('flow-map');svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS(ns,'path');path.classList.add('flow-channel');svg.append(path);
  const drops=Array.from({length:3},()=>{const g=document.createElementNS(ns,'g');g.classList.add('flow-drop');const shape=document.createElementNS(ns,'path');shape.setAttribute('d','M0-15C-2-8-7-2-7 4a7 7 0 0 0 14 0C7-2 2-8 0-15Z');const glint=document.createElementNS(ns,'path');glint.classList.add('water-glint');glint.setAttribute('d','M-3-3Q-6 4-2 7');g.append(shape,glint);svg.append(g);return g;});
  document.body.append(svg);
  const shores=[...document.querySelectorAll('.forest-latest,.field-archive,.field-closing')];
  shores.forEach(section=>{const mark=document.createElement('span');mark.className='river-sill';mark.setAttribute('aria-hidden','true');mark.textContent='＋';section.append(mark);});
  let sourceY=0,targetY=1,total=0,frame=0,lakeVisible=false,bounds=[];
  function measure(){
    const width=document.documentElement.clientWidth,height=document.body.offsetHeight;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.style.height=height+'px';
    const a=chapter.getBoundingClientRect(),b=basin.getBoundingClientRect();
    sourceY=a.top+scrollY+chapter.offsetHeight-innerHeight*.6;
    targetY=b.top+scrollY+basin.offsetHeight*.56;
    const sx=width*.65,ex=width*.5,edge=width-20;
    path.setAttribute('d',`M${sx} ${sourceY}C${sx} ${sourceY+90} ${edge} ${sourceY+70} ${edge} ${sourceY+220}L${edge} ${targetY-140}Q${edge} ${targetY+10} ${ex} ${targetY}`);
    total=path.getTotalLength();path.style.strokeDasharray=String(total);
    bounds=shores.map(section=>{const r=section.getBoundingClientRect();return{section,top:r.top+scrollY,bottom:r.bottom+scrollY};});
    schedule();
  }
  function update(){frame=0;
    const r=chapter.getBoundingClientRect();const local=clamp(-r.top/Math.max(1,chapter.offsetHeight-innerHeight));
    const p=clamp((scrollY+innerHeight*.65-sourceY)/Math.max(1,targetY-sourceY));
    if(reduced.matches){basin.style.setProperty('--lake-level','.55');return;}
    const reveal=clamp((local-.40)/.30);
    const eyes=chapter.querySelector('.gaze-eyes'),plans=chapter.querySelector('.drafting-table'),quote=chapter.querySelector('.gaze-quotation'),tears=chapter.querySelector('.gaze-tears');
    eyes.style.opacity=String(reveal);eyes.style.translate=`0 ${(1-reveal)*22}px`;
    plans.style.opacity=String(1-clamp((local-.34)/.32));
    quote.style.opacity=String(clamp((local-.65)/.2));
    const release=clamp((local-.68)/.32);
    tears.style.opacity=String(release>0?Math.sin(release*Math.PI):0);tears.style.translate=`0 ${release*110}px`;
    drops.forEach((drop,i)=>{const progress=Math.min(1,Math.max(0,p*1.18-i*.07));const point=path.getPointAtLength(total*progress);drop.setAttribute('transform',`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) scale(${i===1?.65:.85})`);drop.style.opacity=p<=i*.06||progress>=1?'0':'.85';});
    path.style.strokeDashoffset=String(total*(1-p));
    basin.style.setProperty('--lake-level',String(.15+p*.8));
    const lead=path.getPointAtLength(total*Math.min(1,p*1.18));
    bounds.forEach(b=>b.section.classList.toggle('water-touched',p>0&&lead.y>=b.top&&lead.y<=b.bottom));
    const visible=basin.getBoundingClientRect().top<innerHeight*.85;
    if(visible&&!lakeVisible)ripple();lakeVisible=visible;
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',measure,{passive:true});addEventListener('load',measure,{once:true});
  document.fonts?.ready.then(measure);reduced.addEventListener('change',()=>{measure();});measure();
})();
