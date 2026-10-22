(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const nativeScroll=CSS.supports('(animation-timeline: view()) and (animation-range: entry)');
  const hero=document.querySelector('.field-hero');
  const stage=document.querySelector('.field-stage');
  const scene=document.querySelector('.field-scene');
  const ritual=document.querySelector('.reading-ritual');
  const ink=document.querySelector('[data-ink-reveal]');
  let words=[];
  if(ink){
    const walker=document.createTreeWalker(ink,NodeFilter.SHOW_TEXT);const nodes=[];let node;
    while((node=walker.nextNode()))if(node.textContent.trim())nodes.push(node);
    nodes.forEach(n=>{const f=document.createDocumentFragment();[...n.textContent].forEach(char=>{const span=document.createElement('span');span.className='ink-word';span.textContent=char;words.push(span);f.append(span);});n.replaceWith(f);});
  }
  if(scene){
    let dragging=false,held=false,frame=0,point=null,startPoint=null;
    const pins=[...scene.querySelectorAll('.field-pin')];
    const selection=document.createElement('div');selection.className='field-selection';selection.setAttribute('aria-hidden','true');scene.append(selection);
    const toggle=document.createElement('button');toggle.type='button';toggle.className='field-light-toggle';toggle.textContent='标注 / NOTES';toggle.setAttribute('aria-pressed','false');toggle.setAttribute('aria-label','显示新闻观察标注');scene.append(toggle);
    toggle.addEventListener('click',()=>{held=!held;toggle.setAttribute('aria-pressed',String(held));pins.forEach(pin=>pin.classList.toggle('selected',held));});
    const helper=scene.querySelector('.field-gesture');if(helper)helper.textContent='[ 拖动框选，发现观察入口 ]';
    function paintSelection(x,y){
      const left=Math.min(startPoint.x,x),top=Math.min(startPoint.y,y),width=Math.abs(x-startPoint.x),height=Math.abs(y-startPoint.y);
      selection.style.transform=`translate(${left}px,${top}px)`;selection.style.width=width+'px';selection.style.height=height+'px';
      const r=scene.getBoundingClientRect();pins.forEach(pin=>{const p=pin.querySelector('i').getBoundingClientRect();const px=p.left+p.width/2-r.left,py=p.top+p.height/2-r.top;if(px>=left&&px<=left+width&&py>=top&&py<=top+height)pin.classList.add('selected');});
    }
    function updatePointer(event){
      if(reduced.matches||(!fine.matches&&!dragging))return;
      point={x:event.clientX,y:event.clientY};if(frame)return;
      frame=requestAnimationFrame(()=>{frame=0;const r=scene.getBoundingClientRect();const x=point.x-r.left,y=point.y-r.top;
        scene.style.setProperty('--cursor-x',`${x}px`);scene.style.setProperty('--cursor-y',`${y}px`);
        scene.style.setProperty('--field-x',`${(x/r.width-.5)*10}px`);scene.style.setProperty('--field-y',`${(y/r.height-.5)*6}px`);
        const label=scene.querySelector('[data-field-coordinate]');if(label)label.textContent=`X ${String(Math.round(x)).padStart(3,'0')} / Y ${String(Math.round(y)).padStart(3,'0')}`;
        if(dragging)paintSelection(x,y);
      });
    }
    scene.addEventListener('pointermove',updatePointer,{passive:true});
    scene.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'||event.button!==0||event.target.closest('a,button')||reduced.matches)return;const r=scene.getBoundingClientRect();startPoint={x:event.clientX-r.left,y:event.clientY-r.top};dragging=true;scene.classList.add('is-dragging');scene.setPointerCapture(event.pointerId);updatePointer(event);});
    function release(event){if(dragging&&event?.clientX!==undefined){const r=scene.getBoundingClientRect();paintSelection(event.clientX-r.left,event.clientY-r.top);}dragging=false;scene.classList.remove('is-dragging');}
    scene.addEventListener('pointerup',release);scene.addEventListener('pointercancel',()=>{dragging=false;scene.classList.remove('is-dragging');});scene.addEventListener('lostpointercapture',release);
    scene.addEventListener('pointerleave',()=>{if(!dragging){scene.style.setProperty('--field-x','0px');scene.style.setProperty('--field-y','0px');}});
    reduced.addEventListener('change',()=>{release();scene.style.setProperty('--field-x','0px');scene.style.setProperty('--field-y','0px');});
    // Separate the actual illustrated trees so a short breeze can pass through the linework.
    const art=scene.querySelector('.field-art'),original=art?.querySelector('img');
    if(original){['left','right'].forEach(side=>{const tree=original.cloneNode(true);tree.alt='';tree.setAttribute('aria-hidden','true');tree.removeAttribute('fetchpriority');tree.className='engraved-tree tree-'+side;art.append(tree);});original.classList.add('architecture-core');scene.addEventListener('pointerenter',()=>{if(reduced.matches||!fine.matches)return;art.querySelectorAll('.engraved-tree').forEach((tree,i)=>tree.animate([{rotate:'0deg'},{rotate:(i?-.35:.4)+'deg',offset:.25},{rotate:(i?.15:-.2)+'deg',offset:.6},{rotate:'0deg'}],{duration:1700,easing:'ease-in-out'}));});}
  }
  const study=document.querySelector('.manifesto-plate');
  if(study){
    const art=study.querySelector('img');art.src=art.src.replace('architecture-study.avif','architecture-finished.avif');
    const lens=document.createElement('div');lens.className='study-loupe';lens.setAttribute('aria-hidden','true');
    const detail=art.cloneNode();detail.alt='';detail.removeAttribute('loading');lens.append(detail);
    const label=document.createElement('span');label.className='loupe-label';label.textContent='2× / DETAIL';lens.append(label);study.append(lens);
    const caption=study.querySelector('figcaption');caption.textContent='PLATE II / ARCHITECTURAL DETAIL';
    let active=false,raf=0,x=0,y=0,tx=0,ty=0,timer=0;
    const locations=[[.42,.30],[.59,.51],[.36,.73]];let stop=0;
    function paint(){raf=0;if(!active||reduced.matches)return;const r=study.getBoundingClientRect();x+=(tx-x)*.09;y+=(ty-y)*.09;
      lens.style.translate=`${x-70}px ${y-70}px`;detail.style.width=r.width*2.2+'px';detail.style.height=r.height*2.2+'px';detail.style.left=70-x*2.2+'px';detail.style.top=70-y*2.2+'px';
      if(Math.hypot(tx-x,ty-y)>.2)raf=requestAnimationFrame(paint);
    }
    function aim(a,b){tx=a;ty=b;if(!raf)raf=requestAnimationFrame(paint);}
    function visit(){const r=study.getBoundingClientRect(),point=locations[stop++%locations.length];aim(r.width*point[0],r.height*point[1]);}
    new IntersectionObserver(entries=>{active=entries[0].isIntersecting;study.classList.toggle('loupe-visible',active&&!reduced.matches);clearInterval(timer);if(active){visit();timer=setInterval(visit,4600);}else{cancelAnimationFrame(raf);raf=0;}},{threshold:.25}).observe(study);
    study.addEventListener('pointermove',event=>{if(!fine.matches||reduced.matches)return;clearInterval(timer);const r=study.getBoundingClientRect();aim(Math.max(75,Math.min(r.width-75,event.clientX-r.left)),Math.max(75,Math.min(r.height-75,event.clientY-r.top)));},{passive:true});
    study.addEventListener('pointerleave',()=>{clearInterval(timer);if(active)timer=setInterval(visit,4600);});
    reduced.addEventListener('change',()=>{study.classList.toggle('loupe-visible',active&&!reduced.matches);if(reduced.matches){cancelAnimationFrame(raf);raf=0;}else visit();});
  }
  // Pointer ink makes the footer behave like a drawing sheet being marked up.
  const wordmark=document.querySelector('.draft-wordmark');
  if(wordmark&&fine.matches){const ink=document.createElement('span');ink.className='wordmark-ink';ink.textContent='HORIZON';wordmark.append(ink);wordmark.addEventListener('pointermove',event=>{if(reduced.matches)return;const r=wordmark.getBoundingClientRect();wordmark.style.setProperty('--ink-x',`${event.clientX-r.left}px`);wordmark.style.setProperty('--ink-y',`${event.clientY-r.top}px`);},{passive:true});}
  let scrollFrame=0;
  const clamp=(n)=>Math.max(0,Math.min(1,n));
  function update(){scrollFrame=0;
    if(words.length){const r=ink.getBoundingClientRect();const progress=reduced.matches?1:clamp((innerHeight*.87-r.top)/(innerHeight*.52));words.forEach((w,i)=>w.classList.toggle('inked',i/words.length<progress));}
    if(nativeScroll||reduced.matches)return;
    if(hero&&stage){const r=hero.getBoundingClientRect();const p=clamp(-r.top/Math.max(1,hero.offsetHeight-stage.offsetHeight));const colors=[[[238,238,228],[40,43,37],[183,76,48]],[[192,189,164],[51,60,44],[169,118,64]],[[52,67,48],[217,221,196],[165,160,119]]];const interval=p<.5?0:1,t=(p-interval*.5)*2;['--field-paper','--field-ink','--field-solar'].forEach((prop,i)=>stage.style.setProperty(prop,`rgb(${colors[interval][i].map((v,j)=>Math.round(v+(colors[interval+1][i][j]-v)*t)).join(',')})`));stage.querySelector('.field-sun').style.transform=`translate(-50%,${p*100}px) scale(${1-p*.2})`;}
    if(ritual){const r=ritual.getBoundingClientRect();const p=clamp(-r.top/Math.max(1,ritual.offsetHeight-innerHeight));const one=ritual.querySelector('.plan-one'),two=ritual.querySelector('.plan-two');one.style.transform=`translateY(${45-p*100}px) rotate(${-10+p*7}deg)`;two.style.transform=`translateY(${80-p*110}px) rotate(${10-p*7}deg)`;ritual.querySelectorAll('.ritual-step').forEach((step,i)=>step.style.opacity=Math.abs(p-i*.5)<.3?'1':'.4');}
  }
  function schedule(){if(!scrollFrame)scrollFrame=requestAnimationFrame(update);}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});reduced.addEventListener('change',()=>{if(reduced.matches){stage?.removeAttribute('style');ritual?.querySelectorAll('.plan,.ritual-step').forEach(x=>x.removeAttribute('style'));}schedule();});update();
})();
